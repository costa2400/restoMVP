import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function RequestVerificationScreen() {
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
  }>();
  const { requestVerification } = useRestaurants();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequest = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      await requestVerification(restaurantId);
      Alert.alert(
        'Verification Requested',
        'Your verification request has been sent to the restaurant manager. You will be notified when it is approved.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Request Verification</Text>
        <Text style={styles.restaurantName}>{restaurantName || 'Restaurant'}</Text>
        <Text style={styles.description}>
          Request verification to post and claim shifts at this restaurant. The
          manager will be notified and can approve your request.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleRequest}>
            <Text style={styles.buttonText}>Request Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
});
