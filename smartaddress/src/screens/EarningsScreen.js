import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getEarnings } from '../services/api';
import { colors } from '../theme/colors';

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}30` }]}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PayoutRow({ item, i }) {
  return (
    <View style={[styles.payoutRow, i > 0 && styles.payoutBorder]}>
      <View>
        <Text style={styles.payoutLabel}>{item.period ?? 'Payout'}</Text>
        <Text style={styles.payoutDate}>{item.paidAt ?? ''}</Text>
      </View>
      <Text style={styles.payoutAmount}>{item.currency ?? '₦'} {Number(item.amount ?? 0).toLocaleString()}</Text>
    </View>
  );
}

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await getEarnings();
      setEarnings(result ?? null);
    } catch (e) {
      setError('Could not load earnings. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = () => {
    Alert.alert('Withdraw Earnings', 'Payout requests are processed every Monday. Your earnings will be sent to your registered mobile money number.', [{ text: 'OK' }]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const currency = earnings?.currency ?? '₦';
  const total = Number(earnings?.totalEarnings ?? earnings?.total ?? 0);
  const thisWeek = Number(earnings?.thisWeek ?? earnings?.weekEarnings ?? 0);
  const pending = Number(earnings?.pending ?? earnings?.pendingPayout ?? 0);
  const deliveries = Number(earnings?.totalDeliveries ?? earnings?.completedDeliveries ?? 0);
  const payouts = Array.isArray(earnings?.payoutHistory) ? earnings.payoutHistory : [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
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
        ) : (
          <>
            {/* Total balance */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Earnings</Text>
              <Text style={styles.balanceAmount}>{currency} {total.toLocaleString()}</Text>
              {pending > 0 && (
                <View style={styles.pendingRow}>
                  <Ionicons name="time-outline" size={14} color={colors.gold} />
                  <Text style={styles.pendingText}>{currency} {pending.toLocaleString()} pending payout</Text>
                </View>
              )}
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatCard label="This Week" value={`${currency} ${thisWeek.toLocaleString()}`} icon="calendar-outline" color={colors.gold} />
              <StatCard label="Deliveries" value={String(deliveries)} icon="bicycle-outline" color="#3B9EFF" />
            </View>

            {/* Withdraw */}
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw} activeOpacity={0.8}>
              <Ionicons name="wallet-outline" size={20} color={colors.dark} />
              <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
            </TouchableOpacity>

            {/* Payout history */}
            <Text style={styles.sectionTitle}>Payout History</Text>
            {payouts.length === 0 ? (
              <View style={styles.emptyPayouts}>
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyText}>No payouts yet</Text>
              </View>
            ) : (
              <View style={styles.payoutList}>
                {payouts.map((item, i) => (
                  <PayoutRow key={i} item={item} i={i} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  balanceCard: {
    margin: 16,
    backgroundColor: colors.darkCard, borderRadius: 20,
    borderWidth: 1, borderColor: `${colors.gold}40`,
    padding: 24, alignItems: 'center', gap: 6,
  },
  balanceLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: colors.white },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pendingText: { fontSize: 13, color: colors.gold },
  statsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, padding: 16, alignItems: 'center', gap: 8,
  },
  statIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.white },
  statLabel: { fontSize: 12, color: colors.textMuted },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.gold, borderRadius: 14,
    paddingVertical: 14, marginHorizontal: 16, marginBottom: 8,
  },
  withdrawBtnText: { fontSize: 15, fontWeight: '700', color: colors.dark },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  payoutList: {
    marginHorizontal: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder, overflow: 'hidden',
  },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  payoutBorder: { borderTopWidth: 1, borderColor: colors.darkBorder },
  payoutLabel: { fontSize: 14, fontWeight: '600', color: colors.white },
  payoutDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payoutAmount: { fontSize: 15, fontWeight: '700', color: colors.green },
  emptyPayouts: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.goldFaded, borderWidth: 1, borderColor: `${colors.gold}50` },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.gold },
});
