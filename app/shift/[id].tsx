import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ShiftWithRelations } from '@/lib/types';
import ShiftDetail from '@/components/ShiftDetail';
import ClaimButton from '@/components/ClaimButton';
import { useAuth } from '@/hooks/useAuth';
import { useShifts } from '@/hooks/useShifts';

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { claimShift } = useShifts();
  const [shift, setShift] = useState<ShiftWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchShift();
    const unsubscribe = subscribeToShift();

    return () => {
      unsubscribe?.();
    };
  }, [id]);

  const fetchShift = async () => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          posted_by_user:users!shifts_posted_by_fkey(*),
          claimed_by_user:users!shifts_claimed_by_fkey(*),
          restaurant:restaurants(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setShift(data);
    } catch (error) {
      console.error('Error fetching shift:', error);
      Alert.alert('Error', 'Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToShift = () => {
    const subscription = supabase
      .channel(`shift-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shifts',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchShift();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleClaim = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to claim a shift');
      return;
    }

    if (!shift || shift.status !== 'open') {
      Alert.alert('Error', 'This shift is no longer available');
      return;
    }

    setClaiming(true);
    try {
      await claimShift(shift.id);
      Alert.alert(
        'Shift Claimed',
        'Your claim has been sent to the manager for approval.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim shift');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!shift) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Shift not found</Text>
      </View>
    );
  }

  const canClaim =
    user &&
    shift.status === 'open' &&
    shift.posted_by !== user.id &&
    !shift.claimed_by;

  return (
    <ScrollView style={styles.container}>
      <ShiftDetail shift={shift} />
      {canClaim && (
        <View style={styles.actionContainer}>
          <ClaimButton onPress={handleClaim} loading={claiming} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  actionContainer: {
    padding: 20,
  },
});
