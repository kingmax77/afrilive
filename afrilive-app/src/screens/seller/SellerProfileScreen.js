import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';

const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={18} color={COLORS.gold} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, label, subtitle, onPress, danger, badge }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.red : COLORS.gold} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && { color: COLORS.red }]}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    {!danger && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
  </TouchableOpacity>
);

export default function SellerProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <LinearGradient colors={[COLORS.liveRed, '#FF6B6B']} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name || 'Seller'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.roleRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>📡 Seller</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total Sales" value="847" icon="bag-handle-outline" />
        <StatCard label="Revenue" value="₦12.4M" icon="cash-outline" />
        <StatCard label="Rating" value="4.8⭐" icon="star-outline" />
      </View>

      {/* Payout */}
      <View style={styles.payoutCard}>
        <View style={styles.payoutLeft}>
          <Text style={styles.payoutLabel}>Available for Payout</Text>
          <Text style={styles.payoutAmount}>₦284,500</Text>
          <Text style={styles.payoutSub}>Next payout: Monday</Text>
        </View>
        <TouchableOpacity style={styles.payoutBtn}>
          <Text style={styles.payoutBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Seller settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Settings</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="storefront-outline" label="Store Profile" subtitle="Name, bio, banner" onPress={() => {}} />
          <MenuItem icon="pricetag-outline" label="Pricing & Currency" subtitle="NGN · ₦" onPress={() => {}} />
          <MenuItem icon="bicycle-outline" label="Delivery Preferences" subtitle="Sendy · Kwik" onPress={() => {}} />
          <MenuItem icon="wallet-outline" label="Payment Settings" subtitle="Bank account · Mobile money" badge="Setup" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="notifications-outline" label="Notifications" subtitle="Orders, stream alerts" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="ID Verification" subtitle="Completed" onPress={() => {}} />
          <MenuItem icon="analytics-outline" label="Analytics" subtitle="Sales insights" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Seller Support" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
        </View>
      </View>

      <Text style={styles.version}>AfriLive Market v1.0.0 · Made for Africa 🌍</Text>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  profileHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: COLORS.liveRed, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: '800' },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  phone: { color: COLORS.textMuted, fontSize: 14, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  roleBadge: { backgroundColor: 'rgba(255,59,48,0.15)', borderWidth: 1, borderColor: COLORS.liveRed, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { color: COLORS.liveRed, fontSize: 13, fontWeight: '700' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(26,107,60,0.15)', borderWidth: 1, borderColor: COLORS.green, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  statCard: { alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11 },
  payoutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, backgroundColor: COLORS.green, borderRadius: 16, padding: 18, marginBottom: 24 },
  payoutLeft: {},
  payoutLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  payoutAmount: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginVertical: 2 },
  payoutSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  payoutBtn: { backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  payoutBtnText: { color: COLORS.green, fontSize: 14, fontWeight: '800' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  menuGroup: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(192,57,43,0.12)' },
  menuContent: { flex: 1 },
  menuLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  menuSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  badge: { backgroundColor: COLORS.gold, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  badgeText: { color: COLORS.dark, fontSize: 11, fontWeight: '700' },
  version: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingBottom: 8 },
});
