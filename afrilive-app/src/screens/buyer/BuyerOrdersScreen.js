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
import OrderCard from '../../components/OrderCard';
import { getBuyerOrders } from '../../services/api';

const STATUS_FILTERS = ['All', 'Active', 'Delivered'];

export default function BuyerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBuyerOrders();
      setOrders(res.data || []);
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const filteredOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (filter === 'Delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search-outline" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
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
      {!loading && error && orders.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders list */}
      {!loading && (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <OrderCard order={item} />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                Watch a live stream and buy something!
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.dark },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle:    { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newBadge:       { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText:   { color: COLORS.dark, fontSize: 11, fontWeight: '800' },
  searchBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  filterTab:      { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterTabActive:{ backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText:     { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive:{ color: COLORS.dark },
  list:           { paddingHorizontal: 20, paddingBottom: 30 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText:      { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },
  retryBtn:       { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:   { color: COLORS.dark, fontSize: 14, fontWeight: '800' },
  emptyState:     { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:     { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle:  { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
