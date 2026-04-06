import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const STAGES = [
  { key: 'placed',    label: 'Order Placed',      icon: 'receipt-outline' },
  { key: 'picked',    label: 'Picked Up',          icon: 'cube-outline' },
  { key: 'transit',   label: 'In Transit',         icon: 'car-outline' },
  { key: 'out',       label: 'Out for Delivery',   icon: 'bicycle-outline' },
  { key: 'delivered', label: 'Delivered',          icon: 'checkmark-circle-outline' },
];

export default function StatusTimeline({ currentStage, timestamps = {} }) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <View style={styles.container}>
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        const dotColor = isCompleted
          ? colors.green
          : isCurrent
          ? colors.gold
          : colors.darkBorder;

        const lineColor = isCompleted ? colors.green : colors.darkBorder;
        const labelColor = isCompleted ? colors.white : isCurrent ? colors.gold : colors.textMuted;

        return (
          <View key={stage.key} style={styles.stageRow}>
            {/* Left column: dot + connecting line */}
            <View style={styles.leftCol}>
              <View style={[styles.dot, { backgroundColor: dotColor, borderColor: dotColor }]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                ) : (
                  <Ionicons name={stage.icon} size={12} color={isCurrent ? colors.dark : colors.textMuted} />
                )}
              </View>
              {index < STAGES.length - 1 && (
                <View style={[styles.line, { backgroundColor: lineColor }]} />
              )}
            </View>

            {/* Right column: label + timestamp */}
            <View style={styles.rightCol}>
              <Text style={[styles.stageLabel, { color: labelColor }, isCurrent && styles.stageLabelActive]}>
                {stage.label}
              </Text>
              {timestamps[stage.key] ? (
                <Text style={styles.timestamp}>{timestamps[stage.key]}</Text>
              ) : isFuture ? (
                <Text style={styles.pending}>Pending</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  leftCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 14,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: -2,
    borderRadius: 1,
  },
  rightCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  stageLabelActive: {
    fontWeight: '700',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  pending: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    fontStyle: 'italic',
  },
});
