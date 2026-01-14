import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Restaurant } from '@/lib/types';
import { useRestaurants } from '@/hooks/useRestaurants';

interface RestaurantPickerProps {
  selectedRestaurantId?: string;
  onSelect: (restaurant: Restaurant) => void;
  verifiedOnly?: boolean;
}

export default function RestaurantPicker({
  selectedRestaurantId,
  onSelect,
  verifiedOnly = false,
}: RestaurantPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const { restaurants, verifications, searchRestaurants } = useRestaurants();

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const results = await searchRestaurants(searchQuery);
      if (verifiedOnly) {
        const verifiedRestaurantIds = verifications
          .filter(v => v.status === 'verified')
          .map(v => v.restaurant_id);
        setSearchResults(results.filter(r => verifiedRestaurantIds.includes(r.id)));
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const displayRestaurants = searchQuery.trim() ? searchResults : restaurants;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search restaurants..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <FlatList
          data={displayRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.restaurantItem,
                selectedRestaurantId === item.id && styles.selectedItem,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.restaurantName}>{item.name}</Text>
              {item.address && (
                <Text style={styles.restaurantAddress}>{item.address}</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No restaurants found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  restaurantItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
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
    marginTop: 20,
  },
});
