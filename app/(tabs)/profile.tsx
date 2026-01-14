import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import ProfileForm from '@/components/ProfileForm';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { verifications } = useRestaurants();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const verifiedRestaurants = verifications.filter(v => v.status === 'verified');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <ProfileForm />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verified Restaurants</Text>
          {verifiedRestaurants.length > 0 ? (
            verifiedRestaurants.map((verification) => (
              <View key={verification.id} style={styles.restaurantItem}>
                <Text style={styles.restaurantName}>
                  {verification.restaurant?.name || 'Unknown'}
                </Text>
                <Text style={styles.restaurantStatus}>
                  Status: {verification.status}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No verified restaurants</Text>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/restaurant-search')}
          >
            <Text style={styles.linkText}>Search Restaurants</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  restaurantItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  restaurantStatus: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  linkButton: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
