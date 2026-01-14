import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';

interface ShiftFiltersProps {
  onDateRangeChange: (start: Date, end: Date) => void;
}

export default function ShiftFilters({ onDateRangeChange }: ShiftFiltersProps) {
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>('week');

  const getDateRange = useCallback((range: 'today' | 'week' | 'month') => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (range) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    return { start, end };
  }, []);

  // Apply initial filter on mount
  useEffect(() => {
    const { start, end } = getDateRange(selectedRange);
    onDateRangeChange(start, end);
  }, []);

  const handleRangeSelect = (range: 'today' | 'week' | 'month') => {
    setSelectedRange(range);
    const { start, end } = getDateRange(range);
    onDateRangeChange(start, end);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter by:</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRange === 'today' && styles.filterButtonActive,
          ]}
          onPress={() => handleRangeSelect('today')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedRange === 'today' && styles.filterButtonTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRange === 'week' && styles.filterButtonActive,
          ]}
          onPress={() => handleRangeSelect('week')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedRange === 'week' && styles.filterButtonTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRange === 'month' && styles.filterButtonActive,
          ]}
          onPress={() => handleRangeSelect('month')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedRange === 'month' && styles.filterButtonTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
