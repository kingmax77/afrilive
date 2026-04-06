import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function DeliveryConfidenceScore({ address, compact = false }) {
  const { score, level, color, factors, missing } = computeScore(address);

  if (compact) {
    return (
      <View style={styles.compact}>
        <View style={[styles.compactDot, { backgroundColor: color }]} />
        <Text style={[styles.compactLevel, { color }]}>{level}</Text>
        <Text style={styles.compactScore}> · {score}% delivery confidence</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DELIVERY CONFIDENCE</Text>
        <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: `${color}50` }]}>
          <Text style={[styles.badgeText, { color }]}>{level}</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barRow}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.scoreNum, { color }]}>{score}%</Text>
      </View>

      {/* Present factors */}
      {factors.length > 0 && (
        <View style={styles.factorGroup}>
          {factors.map((f, i) => (
            <View key={i} style={styles.factorRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.green} />
              <Text style={styles.factorText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Missing factors */}
      {missing.length > 0 && (
        <View style={[styles.factorGroup, styles.missingGroup]}>
          <Text style={styles.missingTitle}>Improve your score:</Text>
          {missing.map((m, i) => (
            <View key={i} style={styles.factorRow}>
              <Ionicons name="add-circle-outline" size={15} color={colors.textMuted} />
              <Text style={styles.missingText}>{m}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function computeScore(address) {
  if (!address) return { score: 0, level: 'Weak', color: '#E53E3E', factors: [], missing: [] };
  let score = 0;
  const factors = [];
  const missing = [];

  if (address.photos?.length >= 2) {
    score += 30; factors.push('Gate & entrance photos');
  } else if (address.photos?.length === 1) {
    score += 15; factors.push('1 entrance photo'); missing.push('Add more photos (+15)');
  } else {
    missing.push('Entrance photos (+30)');
  }

  if (address.arrivalInstructions?.trim()) {
    score += 25; factors.push('Last-50m arrival guide');
  } else {
    missing.push('Arrival instructions (+25)');
  }

  if (address.landmark?.trim()) {
    score += 20; factors.push('Nearby landmark');
  } else {
    missing.push('Nearby landmark (+20)');
  }

  if (address.gateColor) {
    score += 15; factors.push('Gate color');
  } else {
    missing.push('Gate color (+15)');
  }

  if (address.floor?.trim()) {
    score += 10; factors.push('Floor / Apartment');
  } else {
    missing.push('Floor/Apt info (+10)');
  }

  let level, color;
  if (score < 30) { level = 'Weak'; color = '#E53E3E'; }
  else if (score < 55) { level = 'Fair'; color = '#E8A020'; }
  else if (score < 80) { level = 'Good'; color = '#D4AC0D'; }
  else { level = 'Excellent'; color = '#1A6B3C'; }

  return { score, level, color, factors, missing };
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactLevel: {
    fontSize: 13,
    fontWeight: '700',
  },
  compactScore: {
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.darkBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreNum: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 38,
    textAlign: 'right',
  },
  factorGroup: {
    gap: 6,
  },
  missingGroup: {
    borderTopWidth: 1,
    borderColor: colors.darkBorder,
    paddingTop: 10,
  },
  missingTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  missingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
