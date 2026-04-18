import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../constants/mockData';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: COLORS.gold, icon: 'checkmark-circle-outline' },
  dispatched: { label: 'Dispatched', color: '#1A8FE3', icon: 'bicycle-outline' },
  in_transit: { label: 'On the way', color: '#1A8FE3', icon: 'navigate-outline' },
  delivered: { label: 'Delivered', color: COLORS.green, icon: 'checkmark-done-circle' },
  cancelled: { label: 'Cancelled', color: COLORS.red, icon: 'close-circle-outline' },
};

export default function OrderCard({ order, isSeller = false, isNew = false }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;

  return (
    <View style={[styles.card, isNew && styles.cardNew]}>
      {/* Product image */}
      <LinearGradient
        colors={order.productGradient || ['#333', '#555']}
        style={styles.productImage}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{ fontSize: 22 }}>🛍️</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {order.productName}
          </Text>
          <Text style={styles.price}>
            {formatCurrency(order.price * (order.quantity || 1), order.currency)}
          </Text>
        </View>

        <Text style={styles.meta}>
          {isSeller ? `Buyer: ${order.buyerName}` : `From: ${order.sellerName}`}
          {order.quantity > 1 ? ` · ×${order.quantity}` : ''}
        </Text>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.addressCode}>{order.smartAddressCode}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.statusBadge, { borderColor: status.color, backgroundColor: `${status.color}15` }]}>
            <Ionicons name={status.icon} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.orderedAt}>{order.orderedAt}</Text>
        </View>

        {/* Rider info if in transit */}
        {order.riderName && order.status !== 'delivered' && (
          <View style={styles.riderRow}>
            <Text style={styles.riderLabel}>🛵 {order.riderName}</Text>
            <Text style={styles.riderPhone}>{order.riderPhone}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardNew: {
    borderColor: 'rgba(232,160,32,0.5)',
    backgroundColor: 'rgba(232,160,32,0.05)',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  productName: { color: COLORS.white, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  price: { color: COLORS.gold, fontSize: 14, fontWeight: '800' },
  meta: { color: COLORS.textMuted, fontSize: 12, marginBottom: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  addressCode: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderedAt: { color: COLORS.textMuted, fontSize: 11 },
  riderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 8,
  },
  riderLabel: { color: COLORS.white, fontSize: 12 },
  riderPhone: { color: COLORS.gold, fontSize: 12 },
});
