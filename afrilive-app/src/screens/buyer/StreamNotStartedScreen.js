import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function StreamNotStartedScreen({ navigation, route }) {
  const { stream, product } = route.params || {};
  const insets = useSafeAreaInsets();

  const handleRemindMe = () => {
    Alert.alert(
      'Reminder Set',
      `We'll notify you when ${stream?.sellerName || 'the seller'} goes live${stream?.startTime ? ` at ${stream.startTime}` : ''}.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stream Preview</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 56 }}>⏰</Text>
        </View>
        <Text style={styles.title}>Stream Not Started Yet</Text>
        <Text style={styles.sellerName}>{stream?.sellerName || 'Seller'}</Text>
        <Text style={styles.subtitle}>
          {stream?.title || 'This stream hasn\'t started yet.'}
        </Text>
        {stream?.startTime && (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={16} color={COLORS.gold} />
            <Text style={styles.timeText}>Starting at {stream.startTime}</Text>
          </View>
        )}

        {product && (
          <View style={styles.productPreview}>
            <Text style={styles.productPreviewLabel}>Featured Product</Text>
            <Text style={styles.productPreviewName}>{product.name}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.remindBtn} onPress={handleRemindMe}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.dark} />
          <Text style={styles.remindBtnText}>Remind Me When Live</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Browse Other Streams</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  title: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  sellerName: { color: COLORS.gold, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(232,160,32,0.12)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  timeText: { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
  productPreview: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: COLORS.border,
    width: '100%',
  },
  productPreviewLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  productPreviewName: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  remindBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14, marginBottom: 14,
  },
  remindBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
  backLink: { paddingVertical: 10 },
  backLinkText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
});
