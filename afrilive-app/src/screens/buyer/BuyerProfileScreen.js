import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { getBuyerOrders, addRole } from '../../services/api';

const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={COLORS.gold} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, label, subtitle, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.red : COLORS.gold} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && { color: COLORS.red }]}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {!danger && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
  </TouchableOpacity>
);

export default function BuyerProfileScreen({ navigation }) {
  const { user, signOut, updateUser, switchRole } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [addingSellerRole, setAddingSellerRole] = useState(false);

  useEffect(() => {
    getBuyerOrders()
      .then((res) => setOrders(res.data || []))
      .catch(() => {});
  }, []);

  const handleAddSellerRole = async () => {
    Alert.alert(
      'Become a Seller',
      'Add Seller access to your account and start going live?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Seller Access',
          onPress: async () => {
            setAddingSellerRole(true);
            try {
              const res = await addRole('SELLER');
              const { user: updatedUser } = res.data || {};
              await updateUser({
                roles: updatedUser?.roles?.map((r) => r.toUpperCase()) || [...(user?.roles || []), 'SELLER'],
              });
              Alert.alert('Done!', 'Seller access added. You can now switch to Seller Mode.', [
                { text: 'Switch Now', onPress: () => switchRole('SELLER') },
                { text: 'Later', style: 'cancel' },
              ]);
            } catch (err) {
              const errData = err.response?.data;
              const msg =
                (Array.isArray(errData?.message) ? errData.message.join('\n') : errData?.message) ||
                errData?.error ||
                err.message ||
                'Could not add seller access.';
              Alert.alert('Error', msg);
            } finally {
              setAddingSellerRole(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Avatar & Name */}
      <View style={styles.profileHeader}>
        <LinearGradient colors={[COLORS.gold, '#F5B84A']} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name || 'Buyer'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.roleBadgesRow}>
          {(user?.roles || ['BUYER']).map((r) => (
            <View key={r} style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {r === 'SELLER' ? '📡 Seller' : '🛒 Buyer'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Orders" value={orders.length} icon="cube-outline" />
        <StatCard label="Delivered" value={deliveredCount} icon="checkmark-done-circle-outline" />
        <StatCard label="Saved Streams" value="0" icon="bookmark-outline" />
      </View>

      {/* SmartAddress codes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My SmartAddresses</Text>
        {(user?.smartAddressCodes || ['LGS-204-17']).map((code) => (
          <View key={code} style={styles.addressChip}>
            <Ionicons name="location" size={16} color={COLORS.gold} />
            <Text style={styles.addressCode}>{code}</Text>
            <TouchableOpacity style={styles.addressDefault}>
              <Text style={styles.addressDefaultText}>Default</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addAddressBtn}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.gold} />
          <Text style={styles.addAddressText}>Add SmartAddress code</Text>
        </TouchableOpacity>
      </View>

      {/* Add role CTAs */}
      {!user?.roles?.includes('SELLER') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grow on AfriLive</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="radio-outline"
              label="Add Seller Account"
              subtitle="Go live and sell to thousands"
              onPress={handleAddSellerRole}
            />
            <MenuItem
              icon="bicycle-outline"
              label="Become a Rider"
              subtitle="Riders are managed through the SmartAddress app"
              onPress={() =>
                Alert.alert(
                  'Become a Rider',
                  'Rider accounts are managed through the SmartAddress app. Download SmartAddress and sign up as a rider there.',
                  [{ text: 'OK' }]
                )
              }
            />
          </View>
        </View>
      )}

      {/* Switch Mode — only visible for multi-role users */}
      {user?.roles?.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Mode</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="swap-horizontal-outline"
              label="Switch Mode"
              subtitle="You have Buyer & Seller access"
              onPress={() => navigation.navigate('RoleSwitcher')}
            />
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="notifications-outline" label="Notifications" subtitle="Stream alerts & order updates" onPress={() => {}} />
          <MenuItem icon="card-outline" label="Payment Methods" subtitle="M-Pesa, Airtel, MTN MoMo" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="information-circle-outline" label="About AfriLive" onPress={() => {}} />
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
  profileHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  avatarText: { color: COLORS.dark, fontSize: 32, fontWeight: '800' },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  phone: { color: COLORS.textMuted, fontSize: 14, marginBottom: 10 },
  roleBadgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: { backgroundColor: 'rgba(232,160,32,0.15)', borderWidth: 1, borderColor: COLORS.gold, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  statCard: { alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  addressChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  addressCode: { color: COLORS.white, fontSize: 15, fontWeight: '700', flex: 1 },
  addressDefault: { backgroundColor: 'rgba(232,160,32,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  addressDefaultText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  addAddressText: { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
  menuGroup: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(192,57,43,0.12)' },
  menuContent: { flex: 1 },
  menuLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  menuSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  version: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingBottom: 8 },
});
