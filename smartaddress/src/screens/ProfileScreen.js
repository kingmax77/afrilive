import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { AddressContext } from '../context/AddressContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { roles, role, userName, clearRole, addRole } = useContext(AuthContext);
  const { addresses: rawAddresses } = useContext(AddressContext);
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];
  const [addingRole, setAddingRole] = useState(false);

  const isRider = role === 'rider';
  const hasResident = roles?.includes('RESIDENT');
  const hasRider = roles?.includes('RIDER');
  const hasBothRoles = hasResident && hasRider;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'This will clear your session from this device. Your saved addresses will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => clearRole() },
      ]
    );
  };

  const handleAddRole = (newRole) => {
    const roleLabel = newRole === 'RIDER' ? 'Rider' : 'Resident';
    Alert.alert(
      `Add ${roleLabel} Account`,
      `This will add ${roleLabel} access to your existing account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Add ${roleLabel}`,
          onPress: async () => {
            setAddingRole(true);
            try {
              await addRole(newRole);
            } catch (e) {
              Alert.alert('Error', e.message ?? `Could not add ${roleLabel} access. Try again.`);
            } finally {
              setAddingRole(false);
            }
          },
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

          {/* Role badges — one per role */}
          <View style={styles.badgesRow}>
            {hasResident && (
              <View style={[styles.roleBadge, { backgroundColor: colors.goldFaded, borderColor: `${colors.gold}50` }]}>
                <Ionicons name="home-outline" size={13} color={colors.gold} />
                <Text style={[styles.roleBadgeText, { color: colors.gold }]}>Resident / Buyer</Text>
              </View>
            )}
            {hasRider && (
              <View style={[styles.roleBadge, { backgroundColor: colors.greenFaded, borderColor: `${colors.green}50` }]}>
                <Ionicons name="bicycle-outline" size={13} color={colors.green} />
                <Text style={[styles.roleBadgeText, { color: colors.green }]}>Delivery Rider</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats (Resident view) */}
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

        {/* Add role button — only shown when user doesn't have both roles */}
        {!hasBothRoles && (
          <TouchableOpacity
            style={styles.addRoleBtn}
            onPress={() => handleAddRole(hasResident ? 'RIDER' : 'RESIDENT')}
            disabled={addingRole}
            activeOpacity={0.75}
          >
            {addingRole ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <>
                <Ionicons
                  name={hasResident ? 'bicycle-outline' : 'home-outline'}
                  size={18}
                  color={colors.gold}
                />
                <Text style={styles.addRoleBtnText}>
                  {hasResident ? 'Add Rider Account' : 'Add Resident Account'}
                </Text>
                <Ionicons name="add-circle-outline" size={18} color={colors.gold} />
              </>
            )}
          </TouchableOpacity>
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
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
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statDivider: { width: 1, backgroundColor: colors.darkBorder, marginVertical: 4 },
  addRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${colors.gold}60`,
    borderStyle: 'dashed',
    backgroundColor: colors.goldFaded,
  },
  addRoleBtnText: { fontSize: 14, fontWeight: '700', color: colors.gold },
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
