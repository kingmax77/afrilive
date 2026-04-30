import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

const STORAGE_KEY = '@afrilive_seller_payment';

export default function PaymentSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    bankName: '', accountNumber: '', accountName: '',
    mpesa: '', mtnMomo: '', airtelMoney: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setForm(f => ({ ...f, ...JSON.parse(val) }));
    });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const hasMethod = form.bankName || form.mpesa || form.mtnMomo || form.airtelMoney;

  const handleSave = async () => {
    if (!hasMethod) {
      return Alert.alert('Error', 'Please add at least one payout method.');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment Settings</Text>
          {!hasMethod && (
            <View style={styles.setupBadge}><Text style={styles.setupText}>Setup</Text></View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
          <View style={styles.card}>
            <Field label="Bank Name" value={form.bankName} onChangeText={v => set('bankName', v)} placeholder="e.g. Zenith Bank" />
            <Field label="Account Number" value={form.accountNumber} onChangeText={v => set('accountNumber', v)} placeholder="0123456789" keyboardType="numeric" />
            <Field label="Account Name" value={form.accountName} onChangeText={v => set('accountName', v)} placeholder="Your full name as on account" last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile Money</Text>
          <View style={styles.card}>
            <Field label="🇰🇪 M-Pesa Number" value={form.mpesa} onChangeText={v => set('mpesa', v)} placeholder="+254 7XX XXX XXX" keyboardType="phone-pad" />
            <Field label="🇬🇭 MTN MoMo Number" value={form.mtnMomo} onChangeText={v => set('mtnMomo', v)} placeholder="+233 2X XXX XXXX" keyboardType="phone-pad" />
            <Field label="🇳🇬 Airtel Money Number" value={form.airtelMoney} onChangeText={v => set('airtelMoney', v)} placeholder="+234 9XX XXX XXXX" keyboardType="phone-pad" last />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Payment Settings'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, last }) {
  return (
    <View style={[fStyles.wrap, !last && fStyles.wrapBorder]}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={fStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { padding: 14 },
  wrapBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { color: COLORS.white, fontSize: 15 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  setupBadge: {
    backgroundColor: COLORS.gold, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  setupText: { color: COLORS.dark, fontSize: 11, fontWeight: '700' },
  scroll: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
