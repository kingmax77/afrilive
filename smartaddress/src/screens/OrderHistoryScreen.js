import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import { getOrdersBySmartAddress } from '../services/api';
import { colors } from '../theme/colors';

const TABS = ['All', 'Active', 'Delivered'];

const STATUS_LABELS = {
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  CONFIRMED: colors.gold,
  PROCESSING: colors.gold,
  IN_TRANSIT: '#3B9EFF',
  DELIVERED: colors.green,
  CANCELLED: colors.error,
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const status = order?.status ?? 'CONFIRMED';
  const statusColor = STATUS_COLORS[status] ?? colors.gold;
  const productName = order?.product?.name ?? order?.productName ?? 'Package';
  const sellerName = order?.seller?.name ?? order?.sellerName ?? 'AfriLive Seller';
  const amount = Number(order?.totalAmount) || 0;
  const currency = order?.currency ?? '₦';
  const createdAt = order?.createdAt ?? order?.created_at;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="cube-outline" size={20} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
            <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[status] ?? status}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.cardMeta}>
        {amount > 0 && (
          <Text style={styles.amount}>{currency} {amount.toLocaleString()}</Text>
        )}
        {!!createdAt && (
          <Text style={styles.date}>{formatDate(createdAt)}</Text>
        )}
      </View>

      {/* AfriLive badge */}
      <View style={styles.sourceBadge}>
        <Ionicons name="videocam-outline" size={11} color={colors.gold} />
        <Text style={styles.sourceBadgeText}>AfriLive</Text>
      </View>

      {expanded && (
        <View style={styles.timeline}>
          <TimelineRow
            icon="checkmark-circle"
            label="Order Confirmed"
            done={true}
            color={colors.gold}
          />
          <TimelineRow
            icon="cube"
            label="Processing"
            done={['PROCESSING', 'IN_TRANSIT', 'DELIVERED'].includes(status)}
            color={colors.gold}
          />
          <TimelineRow
            icon="bicycle"
            label="In Transit"
            done={['IN_TRANSIT', 'DELIVERED'].includes(status)}
            color="#3B9EFF"
          />
          <TimelineRow
            icon="home"
            label="Delivered"
            done={status === 'DELIVERED'}
            color={colors.green}
            last
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

function TimelineRow({ icon, label, done, color, last }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <Ionicons name={icon} size={18} color={done ? color : colors.darkBorder} />
        {!last && <View style={[styles.timelineLine, done && { backgroundColor: color }]} />}
      </View>
      <Text style={[styles.timelineLabel, done && { color: colors.white }]}>{label}</Text>
    </View>
  );
}

export default function OrderHistoryScreen() {
  const { primaryAddress } = useContext(AddressContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const load = useCallback(async () => {
    const code = primaryAddress?.code;
    if (!code) { setLoading(false); return; }
    try {
      setError(null);
      const response = await getOrdersBySmartAddress(code);
      const arr = Array.isArray(response) ? response : response?.data ?? response?.orders ?? response?.results ?? [];
      setOrders(arr);
    } catch (e) {
      setError('Could not load orders. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [primaryAddress?.code]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); load(); };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'Active') return !['DELIVERED', 'CANCELLED'].includes(o?.status ?? '');
    if (activeTab === 'Delivered') return o?.status === 'DELIVERED';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !primaryAddress ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No address found</Text>
          <Text style={styles.emptySubtitle}>Save a SmartAddress to see your orders here.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No {activeTab !== 'All' ? activeTab.toLowerCase() + ' ' : ''}orders yet</Text>
              <Text style={styles.emptySubtitle}>Orders placed on AfriLive will appear here.</Text>
            </View>
          ) : (
            filteredOrders.map((order, i) => (
              <OrderCard key={order?.id ?? i} order={order} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12, paddingTop: 64 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.dark },
  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.darkCard,
    borderRadius: 16, borderWidth: 1, borderColor: colors.darkBorder,
    padding: 16, gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.goldFaded, justifyContent: 'center', alignItems: 'center',
  },
  productName: { fontSize: 15, fontWeight: '700', color: colors.white },
  sellerName: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '700', color: colors.white },
  date: { fontSize: 12, color: colors.textMuted },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, backgroundColor: colors.goldFaded,
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '700', color: colors.gold },
  timeline: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderColor: colors.darkBorder, gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.darkBorder, marginTop: 2 },
  timelineLabel: { fontSize: 13, color: colors.textMuted, paddingBottom: 16, paddingTop: 1 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.goldFaded, borderWidth: 1, borderColor: `${colors.gold}50` },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
