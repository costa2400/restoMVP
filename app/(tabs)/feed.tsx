import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShifts } from '@/hooks/useShifts';
import { ShiftWithRelations } from '@/lib/types';
import ShiftCard from '@/components/ShiftCard';
import ShiftFilters from '@/components/ShiftFilters';
import { isWithinInterval, parseISO } from 'date-fns';

export default function FeedScreen() {
  const { shifts, loading, refetch } = useShifts();
  const [filteredShifts, setFilteredShifts] = useState<ShiftWithRelations[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (dateRange) {
      const filtered = shifts.filter((shift) => {
        const shiftDate = parseISO(shift.shift_date);
        return isWithinInterval(shiftDate, {
          start: dateRange.start,
          end: dateRange.end,
        });
      });
      setFilteredShifts(filtered);
    } else {
      setFilteredShifts(shifts);
    }
  }, [shifts, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  const handleShiftPress = (shiftId: string) => {
    router.push(`/shift/${shiftId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShiftFilters onDateRangeChange={handleDateRangeChange} />
      <FlatList
        data={filteredShifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShiftCard
            shift={item}
            onPress={() => handleShiftPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No shifts available</Text>
            <Text style={styles.emptySubtext}>
              Check back later or post a shift yourself!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
