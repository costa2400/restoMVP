import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Shift, ShiftWithRelations, ShiftStatus } from '@/lib/types';
import { useAuth } from './useAuth';
import { useRestaurants } from './useRestaurants';
import Constants from 'expo-constants';

export function useShifts() {
  const { user } = useAuth();
  const { verifications } = useRestaurants();
  const [shifts, setShifts] = useState<ShiftWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (user) {
      fetchShifts();
      subscribeToShifts();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, verifications]);

  const fetchShifts = async () => {
    if (!user) return;

    const verifiedRestaurantIds = verifications
      .filter(v => v.status === 'verified' || v.status === 'guest')
      .map(v => v.restaurant_id);

    if (verifiedRestaurantIds.length === 0) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          posted_by_user:users!shifts_posted_by_fkey(*),
          claimed_by_user:users!shifts_claimed_by_fkey(*),
          restaurant:restaurants(*)
        `)
        .in('restaurant_id', verifiedRestaurantIds)
        .eq('status', 'open')
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToShifts = () => {
    if (!user) return;

    const verifiedRestaurantIds = verifications
      .filter(v => v.status === 'verified' || v.status === 'guest')
      .map(v => v.restaurant_id);

    if (verifiedRestaurantIds.length === 0) return;

    subscriptionRef.current = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `restaurant_id=in.(${verifiedRestaurantIds.join(',')})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchShifts();
          }
        }
      )
      .subscribe();
  };

  const claimShift = async (shiftId: string) => {
    if (!user) throw new Error('Not authenticated');

    // First check if shift is still available
    const { data: existingShift, error: checkError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .eq('status', 'open')
      .single();

    if (checkError || !existingShift) {
      throw new Error('This shift is no longer available');
    }

    // Update shift status
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .eq('status', 'open')
      .select()
      .single();

    if (error) throw error;

    // Trigger SMS notification to manager via Edge Function
    try {
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shiftId: data.id }),
        });
      }
    } catch (smsError) {
      // Log error but don't fail the claim
      console.error('Error sending SMS notification:', smsError);
    }

    return data;
  };

  const getMyShifts = async (type: 'posted' | 'claimed') => {
    if (!user) return [];

    let query = supabase
      .from('shifts')
      .select(`
        *,
        posted_by_user:users!shifts_posted_by_fkey(*),
        claimed_by_user:users!shifts_claimed_by_fkey(*),
        restaurant:restaurants(*)
      `);

    if (type === 'posted') {
      query = query.eq('posted_by', user.id);
    } else {
      query = query.eq('claimed_by', user.id);
    }

    const { data, error } = await query
      .order('shift_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  return {
    shifts,
    loading,
    claimShift,
    getMyShifts,
    refetch: fetchShifts,
  };
}
