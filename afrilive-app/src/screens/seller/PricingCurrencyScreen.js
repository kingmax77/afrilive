import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

const STORAGE_KEY = '@afrilive_pricing_currency';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'UGX', symbol: 'USh', label: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'TZS', symbol: 'TSh', label: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand', flag: '🇿🇦' },
  { code: 'XOF', symbol: 'CFA', label: 'West African CFA Franc', flag: '🌍' },
];

export default function PricingCurrencyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setSelectedCurrency(JSON.parse(val).currency || 'NGN');
    });
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ currency: selectedCurrency }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selected = CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pricing & Currency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Active Currency</Text>
          <Text style={styles.previewValue}>
            {selected?.flag} {selected?.symbol} · {selected?.label}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Currency</Text>
        <View style={styles.menuGroup}>
          {CURRENCIES.map((c, i) => (
            <TouchableOpacity
              key={c.code}
              style={[styles.row, i < CURRENCIES.length - 1 && styles.rowBorder]}
              onPress={() => setSelectedCurrency(c.code)}
            >
              <Text style={styles.flag}>{c.flag}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{c.label}</Text>
                <Text style={styles.rowSub}>{c.code} · {c.symbol}</Text>
              </View>
              {selectedCurrency === c.code && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Currency'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: 20 },
  previewCard: {
    backgroundColor: 'rgba(232,160,32,0.12)', borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)', marginBottom: 24,
  },
  previewLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  previewValue: { color: COLORS.gold, fontSize: 18, fontWeight: '800' },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  flag: { fontSize: 24 },
  rowInfo: { flex: 1 },
  rowLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
