import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

export default function RoleSwitcherPill({ bottomOffset = 90 }) {
  const { user, activeRole, switchRole } = useAuth();

  if (!user?.roles || user.roles.length < 2) return null;

  const isSeller = activeRole === 'SELLER';
  const nextRole = isSeller ? 'BUYER' : 'SELLER';
  const label = isSeller ? '🛒 Switch to Buyer Mode' : '📡 Switch to Seller Mode';

  return (
    <TouchableOpacity
      style={[styles.pill, { bottom: bottomOffset }]}
      onPress={() => switchRole(nextRole)}
      activeOpacity={0.85}
    >
      <Text style={styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -110 }],
    width: 220,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  pillText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
