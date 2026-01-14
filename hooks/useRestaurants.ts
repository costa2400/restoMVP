import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Restaurant, Verification, VerificationWithRestaurant } from '@/lib/types';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [verifications, setVerifications] = useState<VerificationWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
    fetchVerifications();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const searchRestaurants = async (query: string) => {
    if (!query.trim()) {
      return restaurants;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (error) throw error;
    return data || [];
  };

  const requestVerification = async (restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('verifications')
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    await fetchVerifications();
    return data;
  };

  return {
    restaurants,
    verifications,
    loading,
    searchRestaurants,
    requestVerification,
    refetch: fetchVerifications,
  };
}
