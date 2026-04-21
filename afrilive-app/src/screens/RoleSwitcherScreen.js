import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useAuth, ACTIVE_ROLE_KEY } from '../hooks/useAuth';
import { addRole } from '../services/api';

const ALL_ROLES = [
  {
    id: 'BUYER',
    emoji: '🛒',
    label: 'Shop as Buyer',
    addLabel: 'Become a Buyer',
    desc: 'Browse live streams and buy instantly',
  },
  {
    id: 'SELLER',
    emoji: '📡',
    label: 'Sell as Seller',
    addLabel: 'Become a Seller',
    desc: 'Go live and sell to thousands across Africa',
  },
];

export default function RoleSwitcherScreen({ route, navigation }) {
  const { signIn, user, switchRole, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(null);

  // Onboarding mode: arrived from OTP with token + apiUser params
  const isOnboarding = !!route.params?.token;
  const token = route.params?.token;
  const apiUser = route.params?.apiUser;

  const currentUser = isOnboarding ? apiUser : user;
  const existingRoles = (currentUser?.roles || []).map((r) => r.toUpperCase());
  const firstName = currentUser?.name?.split(' ')[0] || '';

  const handleSelectRole = async (roleId) => {
    setLoading(roleId);
    try {
      const hasRole = existingRoles.includes(roleId);

      if (isOnboarding) {
        if (!hasRole) {
          const res = await addRole(roleId);
          const updatedApiUser = {
            ...apiUser,
            roles: res.data?.user?.roles || [...existingRoles, roleId],
          };
          await AsyncStorage.setItem(ACTIVE_ROLE_KEY, roleId);
          await signIn(token, updatedApiUser);
        } else {
          await AsyncStorage.setItem(ACTIVE_ROLE_KEY, roleId);
          await signIn(token, apiUser);
        }
        // RootNavigator auto-transitions once signIn updates user context
      } else {
        if (!hasRole) {
          const res = await addRole(roleId);
          const updatedRoles =
            res.data?.user?.roles?.map((r) => r.toUpperCase()) ||
            [...existingRoles, roleId];
          await updateUser({ roles: updatedRoles });
        }
        await switchRole(roleId);
        navigation.goBack();
      }
    } catch (err) {
      const errData = err.response?.data;
      const msg =
        (Array.isArray(errData?.message) ? errData.message.join('\n') : errData?.message) ||
        errData?.error ||
        err.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {!isOnboarding && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.waveEmoji}>👋</Text>
          <Text style={styles.greeting}>
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </Text>
          <Text style={styles.subtitle}>
            How do you want to use AfriLive today?
          </Text>
        </View>

        <View style={styles.cards}>
          {ALL_ROLES.map((role) => {
            const hasRole = existingRoles.includes(role.id);
            const isLoading = loading === role.id;

            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.card, hasRole ? styles.cardOwned : styles.cardAdd]}
                onPress={() => handleSelectRole(role.id)}
                disabled={loading !== null}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconWrap,
                    hasRole ? styles.iconWrapOwned : styles.iconWrapAdd,
                  ]}
                >
                  <Text style={styles.roleEmoji}>{hasRole ? role.emoji : '➕'}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.cardLabel,
                      !hasRole && styles.cardLabelAdd,
                    ]}
                  >
                    {hasRole ? role.label : role.addLabel}
                  </Text>
                  <Text style={styles.cardDesc}>{role.desc}</Text>
                  {!hasRole && (
                    <Text style={styles.addHint}>Tap to add this role</Text>
                  )}
                </View>

                {isLoading ? (
                  <ActivityIndicator
                    color={hasRole ? COLORS.gold : COLORS.textMuted}
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name={hasRole ? 'chevron-forward' : 'add-circle-outline'}
                    size={22}
                    color={hasRole ? COLORS.gold : COLORS.textMuted}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.dark },
  backBtn:       { marginTop: 8, marginLeft: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  scroll:        { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  header:        { paddingTop: 44, marginBottom: 36 },
  waveEmoji:     { fontSize: 44, marginBottom: 12 },
  greeting:      { color: COLORS.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle:      { color: COLORS.textMuted, fontSize: 16, lineHeight: 24 },
  cards:         { gap: 14 },
  card:          { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 18, borderWidth: 2 },
  cardOwned:     { backgroundColor: 'rgba(232,160,32,0.06)', borderColor: COLORS.gold },
  cardAdd:       { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  iconWrap:      { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconWrapOwned: { backgroundColor: 'rgba(232,160,32,0.15)' },
  iconWrapAdd:   { backgroundColor: 'rgba(107,107,107,0.12)' },
  roleEmoji:     { fontSize: 26 },
  cardBody:      { flex: 1 },
  cardLabel:     { color: COLORS.white, fontSize: 17, fontWeight: '800', marginBottom: 3 },
  cardLabelAdd:  { color: COLORS.textSecondary },
  cardDesc:      { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  addHint:       { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginTop: 4 },
});
