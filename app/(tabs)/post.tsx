import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ShiftForm from '@/components/ShiftForm';

export default function PostShiftScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (shiftData: {
    restaurant_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post a shift');
      return;
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert({
        posted_by: user.id,
        restaurant_id: shiftData.restaurant_id,
        shift_date: shiftData.shift_date,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        notes: shiftData.notes || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    Alert.alert('Success', 'Shift posted successfully!', [
      {
        text: 'OK',
        onPress: () => router.push('/(tabs)/feed'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ShiftForm onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
