import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function RoleSwitcherScreen() {
  const { roles, userName, switchActiveRole, addRole } = useContext(AuthContext);
  const [addingRole, setAddingRole] = useState(null); // 'RESIDENT' | 'RIDER' | null

  const hasResident = roles?.includes('RESIDENT');
  const hasRider = roles?.includes('RIDER');

  const handleSelectRole = async (activeRoleKey) => {
    await switchActiveRole(activeRoleKey);
  };

  const handleAddRole = async (roleKey) => {
    const apiRole = roleKey === 'RIDER' ? 'rider' : 'buyer';
    const label = roleKey === 'RIDER' ? 'Rider' : 'Resident';
    setAddingRole(roleKey);
    try {
      await addRole(apiRole);
      await switchActiveRole(roleKey.toLowerCase());
    } catch (e) {
      Alert.alert('Error', e.message ?? `Could not add ${label} access. Try again.`);
      setAddingRole(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Ionicons name="swap-horizontal" size={26} color={colors.dark} />
          </View>
          <Text style={styles.heading}>
            How do you want to use SmartAddress today?
          </Text>
          {userName ? (
            <Text style={styles.subheading}>
              Welcome back, <Text style={{ color: colors.white }}>{userName}</Text>
            </Text>
          ) : (
            <Text style={styles.subheading}>Choose your mode to get started.</Text>
          )}
        </View>

        {/* Existing role cards */}
        {hasResident && (
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardResident]}
            onPress={() => handleSelectRole('resident')}
            activeOpacity={0.85}
            disabled={addingRole !== null}
          >
            <View style={[styles.roleIconBox, { backgroundColor: colors.goldFaded }]}>
              <Ionicons name="home" size={32} color={colors.gold} />
            </View>
            <View style={styles.roleText}>
              <Text style={[styles.roleTitle, { color: colors.gold }]}>Resident Mode</Text>
              <Text style={styles.roleSubtitle}>
                Manage your SmartAddress and track deliveries
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gold} />
          </TouchableOpacity>
        )}

        {hasRider && (
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardRider]}
            onPress={() => handleSelectRole('rider')}
            activeOpacity={0.85}
            disabled={addingRole !== null}
          >
            <View style={[styles.roleIconBox, { backgroundColor: colors.greenFaded }]}>
              <Ionicons name="bicycle" size={32} color={colors.green} />
            </View>
            <View style={styles.roleText}>
              <Text style={[styles.roleTitle, { color: colors.green }]}>Rider Mode</Text>
              <Text style={styles.roleSubtitle}>
                View active deliveries and navigate to addresses
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.green} />
          </TouchableOpacity>
        )}

        {/* Add new role section */}
        {(!hasResident || !hasRider) && (
          <View style={styles.addSection}>
            <Text style={styles.addSectionTitle}>Add a new role</Text>

            {!hasRider && (
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => handleAddRole('RIDER')}
                disabled={addingRole !== null}
                activeOpacity={0.75}
              >
                {addingRole === 'RIDER' ? (
                  <ActivityIndicator size="small" color={colors.green} />
                ) : (
                  <Ionicons name="add-circle-outline" size={20} color={colors.green} />
                )}
                <Text style={[styles.addCardText, { color: colors.green }]}>
                  Register as Rider
                </Text>
                <View style={[styles.addBadge, { backgroundColor: colors.greenFaded }]}>
                  <Ionicons name="bicycle-outline" size={15} color={colors.green} />
                </View>
              </TouchableOpacity>
            )}

            {!hasResident && (
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => handleAddRole('RESIDENT')}
                disabled={addingRole !== null}
                activeOpacity={0.75}
              >
                {addingRole === 'RESIDENT' ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : (
                  <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
                )}
                <Text style={[styles.addCardText, { color: colors.gold }]}>
                  Register as Resident
                </Text>
                <View style={[styles.addBadge, { backgroundColor: colors.goldFaded }]}>
                  <Ionicons name="home-outline" size={15} color={colors.gold} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  scroll: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48 },

  header: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.darkCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  roleCardResident: { borderColor: `${colors.gold}50` },
  roleCardRider: { borderColor: `${colors.green}50` },
  roleIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  roleSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  addSection: { marginTop: 8 },
  addSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.darkCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderStyle: 'dashed',
  },
  addCardText: { flex: 1, fontSize: 15, fontWeight: '600' },
  addBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
