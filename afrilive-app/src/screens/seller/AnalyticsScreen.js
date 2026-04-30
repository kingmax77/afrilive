import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

const REVENUE_DATA = [
  { day: 'Mon', value: 42000 },
  { day: 'Tue', value: 78000 },
  { day: 'Wed', value: 31000 },
  { day: 'Thu', value: 95000 },
  { day: 'Fri', value: 120000 },
  { day: 'Sat', value: 88000 },
  { day: 'Sun', value: 67000 },
];

const TOP_PRODUCTS = [
  { name: 'Ankara Wrap Dress', sales: 142, revenue: '₦1.77M' },
  { name: 'Gold Hoop Earrings', sales: 98, revenue: '₦441K' },
  { name: 'Leather Crossbody Bag', sales: 61, revenue: '₦1.1M' },
  { name: 'Kente Print Shirt', sales: 44, revenue: '₦352K' },
];

const ORDER_STATUS = [
  { label: 'Delivered', count: 604, color: COLORS.green },
  { label: 'In Transit', count: 122, color: COLORS.gold },
  { label: 'Confirmed', count: 87, color: '#2980b9' },
  { label: 'Pending', count: 34, color: COLORS.textMuted },
];

const PEAK_HOURS = [
  { hour: '9am', viewers: 320 },
  { hour: '12pm', viewers: 580 },
  { hour: '3pm', viewers: 890 },
  { hour: '6pm', viewers: 1240 },
  { hour: '8pm', viewers: 1560 },
  { hour: '10pm', viewers: 940 },
];

const maxRevenue = Math.max(...REVENUE_DATA.map(d => d.value));
const maxViewers = Math.max(...PEAK_HOURS.map(d => d.viewers));

export default function AnalyticsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const BAR_H = 120;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Revenue', value: '₦12.4M', icon: 'cash-outline' },
            { label: 'Total Orders', value: '847', icon: 'bag-outline' },
            { label: 'Avg. Rating', value: '4.8⭐', icon: 'star-outline' },
          ].map(s => (
            <View key={s.label} style={styles.summaryCard}>
              <Ionicons name={s.icon} size={18} color={COLORS.gold} />
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue — Last 7 Days</Text>
          <View style={styles.barChart}>
            {REVENUE_DATA.map(d => {
              const barHeight = Math.max(8, (d.value / maxRevenue) * BAR_H);
              return (
                <View key={d.day} style={styles.barWrap}>
                  <Text style={styles.barValueLabel}>
                    {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}K` : d.value}
                  </Text>
                  <View style={[styles.bar, { height: barHeight }]} />
                  <Text style={styles.barDay}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Selling Products</Text>
          {TOP_PRODUCTS.map((p, i) => (
            <View key={p.name} style={[styles.productRow, i < TOP_PRODUCTS.length - 1 && styles.rowBorder]}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productMeta}>{p.sales} sold</Text>
              </View>
              <Text style={styles.productRevenue}>{p.revenue}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Orders by Status</Text>
          {ORDER_STATUS.map((s, i) => {
            const total = ORDER_STATUS.reduce((acc, x) => acc + x.count, 0);
            const pct = Math.round((s.count / total) * 100);
            return (
              <View key={s.label} style={[styles.statusRow, i < ORDER_STATUS.length - 1 && styles.rowBorder]}>
                <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                <Text style={styles.statusLabel}>{s.label}</Text>
                <View style={styles.statusBarWrap}>
                  <View style={[styles.statusBar, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.statusCount}>{s.count}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Peak Viewing Hours</Text>
          <View style={styles.barChart}>
            {PEAK_HOURS.map(d => {
              const barHeight = Math.max(8, (d.viewers / maxViewers) * 80);
              return (
                <View key={d.hour} style={styles.barWrap}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: '#2980b9' }]} />
                  <Text style={styles.barDay}>{d.hour}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryValue: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  summaryLabel: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
  chartCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginBottom: 16,
  },
  chartTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
  barWrap: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 4 },
  barValueLabel: { color: COLORS.textMuted, fontSize: 9 },
  bar: { width: 24, backgroundColor: COLORS.gold, borderRadius: 4 },
  barDay: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rankCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(232,160,32,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  rankText: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  productInfo: { flex: 1 },
  productName: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  productMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  productRevenue: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: COLORS.white, fontSize: 13, fontWeight: '600', width: 72 },
  statusBarWrap: {
    flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden',
  },
  statusBar: { height: '100%', borderRadius: 3 },
  statusCount: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', width: 30, textAlign: 'right' },
});
