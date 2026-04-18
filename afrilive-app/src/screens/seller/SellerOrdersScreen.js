import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getSellerOrders } from '../../services/api';
import OrderCard from '../../components/OrderCard';

const STATUS_FILTERS = ['All', 'New', 'Dispatched', 'Delivered'];

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSellerOrders();
      setOrders(res.data || []);
    } catch {
      setError('Could not load orders. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const filteredOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'New') return o.status === 'confirmed' || o.status === 'processing';
    if (filter === 'Dispatched') return o.status === 'dispatched' || o.status === 'in_transit';
    if (filter === 'Delivered') return o.status === 'delivered';
    return true;
  });

  const pendingCount = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'processing'
  ).length;

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incoming Orders</Text>
          {!loading && pendingCount > 0 && (
            <Text style={styles.pendingAlert}>
              ⚡ {pendingCount} new order{pendingCount > 1 ? 's' : ''} need action
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stats summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {loading ? '—' : String(orders.length)}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.gold }]}>
            {loading ? '—' : String(pendingCount)}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.green }]}>
            {loading ? '—' : String(deliveredCount)}
          </Text>
          <Text style={styles.summaryLabel}>Delivered</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders list */}
      {!loading && !error && (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <OrderCard order={item} isSeller />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>No {filter.toLowerCase()} orders</Text>
              <Text style={styles.emptySubtitle}>
                Orders placed during your live streams appear here
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  pendingAlert: { color: COLORS.gold, fontSize: 13, marginTop: 3 },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterTabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: COLORS.dark },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText: { color: COLORS.dark, fontSize: 14, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
