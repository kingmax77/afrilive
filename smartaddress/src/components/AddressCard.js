import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';

export default function AddressCard({ address, onPress, showCopy = true }) {
  const handleCopy = async (e) => {
    e.stopPropagation?.();
    await Clipboard.setStringAsync(address.code);
  };

  const createdDate = address.createdAt
    ? new Date(address.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {/* Gold left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* Code row */}
        <View style={styles.codeRow}>
          <Text style={styles.code}>{address.code}</Text>
          {showCopy && (
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={18} color={colors.gold} />
            </TouchableOpacity>
          )}
        </View>

        {/* Label */}
        <Text style={styles.label}>{address.label}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {address.landmark ? (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {address.landmark}
              </Text>
            </View>
          ) : null}
          {createdDate ? (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{createdDate}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Arrow if pressable */}
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.gold,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 140,
  },
  arrow: {
    alignSelf: 'center',
    marginRight: 12,
  },
});
