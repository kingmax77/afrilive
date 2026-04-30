import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getActiveDelivery, markDelivered } from '../services/api';
import { colors } from '../theme/colors';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ActiveDeliveryScreen() {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await getActiveDelivery();
      setDelivery(result ?? null);
    } catch (e) {
      if (e?.message?.includes('404') || e?.message?.includes('No active')) {
        setDelivery(null);
      } else {
        setError('Could not load delivery. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkDelivered = () => {
    if (!delivery?.orderId && !delivery?.id) return;
    Alert.alert(
      'Mark as Delivered',
      'Confirm that you have delivered this parcel to the recipient.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: async () => {
            setMarking(true);
            try {
              await markDelivered(delivery.orderId ?? delivery.id);
              setDelivery(null);
              Alert.alert('Done', 'Delivery marked as complete.');
            } catch (e) {
              Alert.alert('Error', e?.message ?? 'Could not update delivery. Try again.');
            } finally {
              setMarking(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
          contentContainerStyle={styles.emptyContainer}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="bicycle" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtitle}>You don't have an assigned delivery right now. New assignments will appear here automatically.</Text>
          <Text style={styles.emptyHint}>Pull to refresh</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const recipient = delivery?.recipient ?? delivery?.buyer ?? {};
  const address = delivery?.address ?? delivery?.smartAddress ?? {};
  const product = delivery?.product ?? delivery?.order?.product ?? {};

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <Ionicons name="bicycle" size={22} color={colors.gold} />
          <Text style={styles.statusBannerText}>Active Delivery</Text>
          <View style={styles.statusDot} />
        </View>

        {/* Parcel info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parcel</Text>
          <InfoRow icon="cube-outline" label="Item" value={product?.name ?? delivery?.parcelName ?? 'Package'} />
          <InfoRow icon="pricetag-outline" label="Order ID" value={String(delivery?.orderId ?? delivery?.id ?? '')} />
          <InfoRow icon="cash-outline" label="Value" value={delivery?.totalAmount ? `${delivery?.currency ?? '₦'} ${Number(delivery.totalAmount).toLocaleString()}` : null} />
        </View>

        {/* Delivery address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <InfoRow icon="barcode-outline" label="SmartAddress Code" value={address?.code ?? delivery?.smartAddressCode} />
          <InfoRow icon="flag-outline" label="Landmark" value={address?.landmark ?? delivery?.landmark} />
          <InfoRow icon="color-fill-outline" label="Gate Color" value={address?.gateColor ?? delivery?.gateColor} />
          <InfoRow icon="document-text-outline" label="Arrival Notes" value={address?.arrivalInstructions ?? delivery?.arrivalInstructions} />
        </View>

        {/* Recipient */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipient</Text>
          <InfoRow icon="person-outline" label="Name" value={recipient?.name ?? recipient?.userName} />
          <InfoRow icon="call-outline" label="Phone" value={recipient?.phone} />
        </View>

        {/* Mark delivered button */}
        <TouchableOpacity
          style={[styles.deliveredBtn, marking && { opacity: 0.7 }]}
          onPress={handleMarkDelivered}
          disabled={marking}
          activeOpacity={0.8}
        >
          {marking
            ? <ActivityIndicator size="small" color={colors.dark} />
            : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.dark} />
                <Text style={styles.deliveredBtnText}>Mark as Delivered</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyIconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkBorder,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyHint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.goldFaded, borderWidth: 1, borderColor: `${colors.gold}50` },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.goldFaded, borderRadius: 14,
    borderWidth: 1, borderColor: `${colors.gold}40`,
    padding: 14, marginBottom: 16,
  },
  statusBannerText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.gold },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  card: {
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
    padding: 16, marginBottom: 12, gap: 4,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.white },
  deliveredBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.gold, borderRadius: 14,
    paddingVertical: 16, marginTop: 8,
  },
  deliveredBtnText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});
