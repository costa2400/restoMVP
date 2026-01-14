import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Restaurant } from '@/lib/types';
import RestaurantPicker from './RestaurantPicker';
import { format } from 'date-fns';

interface ShiftFormProps {
  onSubmit: (shiftData: {
    restaurant_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function ShiftForm({ onSubmit, onCancel }: ShiftFormProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [shiftDate, setShiftDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setShiftDate(format(tomorrow, 'yyyy-MM-dd'));
  }, []);

  const handleSubmit = async () => {
    if (!selectedRestaurant) {
      Alert.alert('Error', 'Please select a restaurant');
      return;
    }

    if (!shiftDate || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate time
    if (startTime >= endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Validate date is in the future
    const selectedDate = new Date(shiftDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      Alert.alert('Error', 'Shift date must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        restaurant_id: selectedRestaurant.id,
        shift_date: shiftDate,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || undefined,
      });
      // Reset form
      setSelectedRestaurant(null);
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post shift');
    } finally {
      setSubmitting(false);
    }
  };

  if (showRestaurantPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowRestaurantPicker(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Select Restaurant</Text>
        </View>
        <RestaurantPicker
          selectedRestaurantId={selectedRestaurant?.id}
          onSelect={(restaurant) => {
            setSelectedRestaurant(restaurant);
            setShowRestaurantPicker(false);
          }}
          verifiedOnly={true}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Restaurant *</Text>
        <TouchableOpacity
          style={styles.restaurantButton}
          onPress={() => setShowRestaurantPicker(true)}
        >
          <Text style={styles.restaurantButtonText}>
            {selectedRestaurant ? selectedRestaurant.name : 'Select Restaurant'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={shiftDate}
          onChangeText={setShiftDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />
        <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Start Time *</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM (24-hour format)"
          placeholderTextColor="#999"
        />
        <Text style={styles.hint}>Format: HH:MM (e.g., 09:00, 14:30)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>End Time *</Text>
        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM (24-hour format)"
          placeholderTextColor="#999"
        />
        <Text style={styles.hint}>Format: HH:MM (e.g., 17:00, 22:30)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional details..."
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Posting...' : 'Post Shift'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  restaurantButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  restaurantButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
