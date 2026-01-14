import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Restaurant } from '@/lib/types';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function RestaurantSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const { searchRestaurants } = useRestaurants();
  const router = useRouter();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchRestaurants(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    router.push({
      pathname: '/request-verification',
      params: { restaurantId: restaurant.id, restaurantName: restaurant.name },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Restaurants</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by restaurant name..."
        value={searchQuery}
        onChangeText={handleSearch}
        autoFocus
      />

      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantItem}
              onPress={() => handleSelectRestaurant(item)}
            >
              <Text style={styles.restaurantName}>{item.name}</Text>
              {item.address && (
                <Text style={styles.restaurantAddress}>{item.address}</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <Text style={styles.emptyText}>No restaurants found</Text>
            ) : (
              <Text style={styles.emptyText}>Start typing to search...</Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    margin: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  },
});
