import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { AddressContext } from '../context/AddressContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { role, userName, clearRole } = useContext(AuthContext);
  const { addresses } = useContext(AddressContext);

  const isRider = role === 'rider';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'This will clear your role and name from this device. Your saved addresses will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => clearRole(),
        },
      ]
    );
  };

  const MENU_ITEMS = isRider
    ? [
        { icon: 'bicycle-outline', label: 'Active Deliveries', sublabel: 'View your current assignments', onPress: () => {} },
        { icon: 'stats-chart-outline', label: 'Delivery History', sublabel: 'Past completed deliveries', onPress: () => {} },
        { icon: 'call-outline', label: 'Support', sublabel: 'Contact AfriLive support', onPress: () => {} },
      ]
    : [
        { icon: 'location-outline', label: 'My Addresses', sublabel: `${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''}`, onPress: () => {} },
        { icon: 'cube-outline', label: 'Order History', sublabel: 'Past AfriLive orders', onPress: () => {} },
        { icon: 'call-outline', label: 'Support', sublabel: 'Contact AfriLive support', onPress: () => {} },
      ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar + Info */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: isRider ? colors.greenFaded : colors.goldFaded }]}>
            <Ionicons
              name={isRider ? 'bicycle' : 'person'}
              size={36}
              color={isRider ? colors.green : colors.gold}
            />
          </View>
          <Text style={styles.userName}>{userName || 'SmartAddress User'}</Text>
          <View style={[
            styles.roleBadge,
            { backgroundColor: isRider ? colors.greenFaded : colors.goldFaded,
              borderColor: isRider ? `${colors.green}50` : `${colors.gold}50` }
          ]}>
            <Ionicons
              name={isRider ? 'bicycle-outline' : 'home-outline'}
              size={13}
              color={isRider ? colors.green : colors.gold}
            />
            <Text style={[styles.roleBadgeText, { color: isRider ? colors.green : colors.gold }]}>
              {isRider ? 'Delivery Rider' : 'Resident / Buyer'}
            </Text>
          </View>
        </View>

        {/* Stats (Resident) */}
        {!isRider && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{addresses.length}</Text>
              <Text style={styles.statLabel}>Address{addresses.length !== 1 ? 'es' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i === 0 && styles.menuItemFirst]}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={20} color={colors.gold} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <View style={styles.appInfoRow}>
            <View style={styles.appInfoIcon}>
              <Ionicons name="location" size={16} color={colors.dark} />
            </View>
            <View>
              <Text style={styles.appInfoName}>SmartAddress</Text>
              <Text style={styles.appInfoVersion}>Part of AfriLive Market · v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: colors.darkBorder,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.white },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: { fontSize: 22, fontWeight: '700', color: colors.white },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statDivider: { width: 1, backgroundColor: colors.darkBorder, marginVertical: 4 },
  menuSection: {
    marginHorizontal: 20,
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.darkBorder,
    gap: 14,
  },
  menuItemFirst: { borderTopWidth: 0 },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.white },
  menuSublabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  appInfo: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.darkCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  appInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appInfoIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  appInfoName: { fontSize: 14, fontWeight: '700', color: colors.white },
  appInfoVersion: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}10`,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
