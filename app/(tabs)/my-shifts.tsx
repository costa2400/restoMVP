import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShifts } from '@/hooks/useShifts';
import { ShiftWithRelations } from '@/lib/types';
import ShiftCard from '@/components/ShiftCard';

export default function MyShiftsScreen() {
  const [activeTab, setActiveTab] = useState<'posted' | 'claimed'>('posted');
  const [postedShifts, setPostedShifts] = useState<ShiftWithRelations[]>([]);
  const [claimedShifts, setClaimedShifts] = useState<ShiftWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { getMyShifts } = useShifts();
  const router = useRouter();

  useEffect(() => {
    loadShifts();
  }, [activeTab]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posted') {
        const shifts = await getMyShifts('posted');
        setPostedShifts(shifts);
      } else {
        const shifts = await getMyShifts('claimed');
        setClaimedShifts(shifts);
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentShifts = activeTab === 'posted' ? postedShifts : claimedShifts;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posted' && styles.activeTab]}
          onPress={() => setActiveTab('posted')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'posted' && styles.activeTabText,
            ]}
          >
            Posted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'claimed' && styles.activeTab]}
          onPress={() => setActiveTab('claimed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'claimed' && styles.activeTabText,
            ]}
          >
            Claimed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentShifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShiftCard
            shift={item}
            onPress={() => router.push(`/shift/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} shifts yet
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadShifts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
