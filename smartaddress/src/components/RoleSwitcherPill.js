import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function RoleSwitcherPill() {
  const { activeRole, switchActiveRole } = useContext(AuthContext);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        <TouchableOpacity
          style={[styles.option, activeRole === 'resident' && styles.optionActiveResident]}
          onPress={() => switchActiveRole('resident')}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionText, activeRole === 'resident' && styles.optionTextActiveResident]}>
            🏠 Resident
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, activeRole === 'rider' && styles.optionActiveRider]}
          onPress={() => switchActiveRole('rider')}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionText, activeRole === 'rider' && styles.optionTextActiveRider]}>
            🛵 Rider
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.darkCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  optionActiveResident: {
    backgroundColor: colors.goldFaded,
  },
  optionActiveRider: {
    backgroundColor: colors.greenFaded,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  optionTextActiveResident: {
    color: colors.gold,
  },
  optionTextActiveRider: {
    color: colors.green,
  },
});
