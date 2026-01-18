
import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { MapPin, Clock } from 'lucide-react-native';
import { useTrails } from '@/context/TrailsContext';
import { Trail } from '@/types/trail';
import { formatDistance, formatDuration, formatDate } from '@/utils/distance';

export default function TrailsScreen() {
  const router = useRouter();
  const { trails, isLoading } = useTrails();

  const renderTrailItem = ({ item }: { item: Trail }) => (
    <TouchableOpacity
      style={styles.trailItem}
      onPress={() => router.push(`/trail/${item.id}` as any)}
    >
      <View style={styles.trailHeader}>
        <View style={styles.iconContainer}>
          <MapPin size={24} color={colors.primary} />
        </View>
        <View style={styles.trailInfo}>
          <Text style={styles.trailDate}>{formatDate(item.date)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MapPin size={16} color={colors.muted} />
              <Text style={styles.statText}>{formatDistance(item.distance)}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color={colors.muted} />
              <Text style={styles.statText}>{formatDuration(item.duration)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MapPin size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>No trails yet</Text>
      <Text style={styles.emptyText}>
        Start recording your first dog walk to see it here!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trails}
        renderItem={renderTrailItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={trails.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  trailItem: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailInfo: {
    flex: 1,
  },
  trailDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.darkGreen,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
