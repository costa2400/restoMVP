import { View, Text, StyleSheet } from 'react-native';
import { ShiftWithRelations } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface ShiftDetailProps {
  shift: ShiftWithRelations;
}

export default function ShiftDetail({ shift }: ShiftDetailProps) {
  const shiftDate = parseISO(shift.shift_date);
  const formattedDate = format(shiftDate, 'EEEE, MMMM d, yyyy');
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Restaurant</Text>
        <Text style={styles.value}>{shift.restaurant?.name || 'Unknown'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{formattedDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time</Text>
        <Text style={styles.value}>
          {startTime} - {endTime}
        </Text>
      </View>

      {shift.posted_by_user && (
        <View style={styles.section}>
          <Text style={styles.label}>Posted By</Text>
          <Text style={styles.value}>
            {shift.posted_by_user.full_name || 'Unknown'}
            {shift.posted_by_user.years_experience && (
              <Text style={styles.experience}>
                {' '}
                ({shift.posted_by_user.years_experience} years experience)
              </Text>
            )}
          </Text>
        </View>
      )}

      {shift.claimed_by_user && (
        <View style={styles.section}>
          <Text style={styles.label}>Claimed By</Text>
          <Text style={styles.value}>
            {shift.claimed_by_user.full_name || 'Unknown'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <View style={[styles.statusBadge, getStatusStyle(shift.status)]}>
          <Text style={styles.statusText}>{shift.status.toUpperCase()}</Text>
        </View>
      </View>

      {shift.notes && (
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{shift.notes}</Text>
        </View>
      )}
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'open':
      return { backgroundColor: '#e3f2fd' };
    case 'claimed':
      return { backgroundColor: '#fff3e0' };
    case 'approved':
      return { backgroundColor: '#e8f5e9' };
    case 'denied':
      return { backgroundColor: '#ffebee' };
    default:
      return { backgroundColor: '#f5f5f5' };
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    color: '#333',
  },
  experience: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
