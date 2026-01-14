import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShiftWithRelations } from '@/lib/types';
import { format } from 'date-fns';

interface ShiftCardProps {
  shift: ShiftWithRelations;
  onPress: () => void;
}

export default function ShiftCard({ shift, onPress }: ShiftCardProps) {
  const shiftDate = new Date(shift.shift_date);
  const formattedDate = format(shiftDate, 'EEE, MMM d');
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.time}>
          {startTime} - {endTime}
        </Text>
      </View>

      <Text style={styles.restaurantName}>
        {shift.restaurant?.name || 'Unknown Restaurant'}
      </Text>

      {shift.posted_by_user && (
        <Text style={styles.posterName}>
          Posted by {shift.posted_by_user.full_name || 'Unknown'}
        </Text>
      )}

      {shift.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {shift.notes}
        </Text>
      )}

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{shift.status.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  posterName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
});
