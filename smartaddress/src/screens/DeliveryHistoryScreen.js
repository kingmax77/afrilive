import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDeliveryHistory } from '../services/api';
import { colors } from '../theme/colors';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function DeliveryCard({ item }) {
  const product = item?.product ?? item?.order?.product ?? {};
  const address = item?.address ?? item?.smartAddress ?? {};
  const deliveredAt = item?.deliveredAt ?? item?.completedAt ?? item?.updatedAt;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>
            {product?.name ?? item?.parcelName ?? 'Package'}
          </Text>
          {!!address.code && (
            <Text style={styles.code}>{address.code}</Text>
          )}
        </View>
        <View>
          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredBadgeText}>Delivered</Text>
          </View>
          {!!deliveredAt && (
            <Text style={styles.date}>{formatDate(deliveredAt)}</Text>
          )}
        </View>
      </View>
      {!!address.landmark && (
        <Text style={styles.landmark} numberOfLines={1}>
          <Ionicons name="flag-outline" size={12} color={colors.textMuted} /> {address.landmark}
        </Text>
      )}
      {!!item?.deliveryFee && (
        <Text style={styles.fee}>Fee: {item?.currency ?? '₦'} {Number(item.deliveryFee).toLocaleString()}</Text>
      )}
    </View>
  );
}

export default function DeliveryHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await getDeliveryHistory();
      const arr = Array.isArray(response) ? response : response?.data ?? response?.deliveries ?? response?.results ?? [];
      setHistory(arr);
    } catch (e) {
      setError('Could not load history. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        {error ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="bicycle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySubtitle}>Completed deliveries will appear here.</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{history.length}</Text>
                <Text style={styles.statLabel}>Total Deliveries</Text>
              </View>
            </View>
            {history.map((item, i) => (
              <DeliveryCard key={item?.id ?? i} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12, paddingTop: 64 },
  statsRow: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 28, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 12, color: colors.textMuted },
  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
    padding: 16, gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: `${colors.green}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  productName: { fontSize: 15, fontWeight: '700', color: colors.white },
  code: { fontSize: 12, color: colors.gold, fontWeight: '600', marginTop: 2 },
  deliveredBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: `${colors.green}20`,
    alignSelf: 'flex-end',
  },
  deliveredBadgeText: { fontSize: 11, fontWeight: '700', color: colors.green },
  date: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  landmark: { fontSize: 13, color: colors.textMuted },
  fee: { fontSize: 12, color: colors.textMuted },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.goldFaded, borderWidth: 1, borderColor: `${colors.gold}50` },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
