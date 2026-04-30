import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

const STORAGE_KEY = '@afrilive_payment_methods';

const METHOD_TYPES = [
  { key: 'mpesa', label: 'M-Pesa', emoji: '🇰🇪', color: '#00a651' },
  { key: 'mtn', label: 'MTN MoMo', emoji: '🇬🇭', color: '#ffcc00' },
  { key: 'airtel', label: 'Airtel Money', emoji: '🇳🇬', color: '#e60012' },
  { key: 'card', label: 'Card', emoji: '💳', color: COLORS.gold },
];

export default function PaymentMethodsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState({});
  const [defaultMethod, setDefaultMethod] = useState(null);
  const [modal, setModal] = useState(null);
  const [input, setInput] = useState({ phone: '', cardNumber: '', expiry: '', cvv: '' });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) {
        const parsed = JSON.parse(val);
        setMethods(parsed.methods || {});
        setDefaultMethod(parsed.defaultMethod || null);
      }
    });
  }, []);

  const save = async (newMethods, newDefault) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      methods: newMethods ?? methods,
      defaultMethod: newDefault ?? defaultMethod,
    }));
  };

  const handleAdd = (type) => {
    setInput({ phone: '', cardNumber: '', expiry: '', cvv: '' });
    setModal(type);
  };

  const handleSaveMethod = async () => {
    let value;
    if (modal === 'card') {
      if (!input.cardNumber || !input.expiry) {
        return Alert.alert('Error', 'Please enter card number and expiry.');
      }
      value = { cardNumber: input.cardNumber.slice(-4), expiry: input.expiry };
    } else {
      if (!input.phone) return Alert.alert('Error', 'Please enter a phone number.');
      value = { phone: input.phone };
    }
    const updated = { ...methods, [modal]: value };
    const newDefault = defaultMethod || modal;
    setMethods(updated);
    setDefaultMethod(newDefault);
    await save(updated, newDefault);
    setModal(null);
  };

  const handleRemove = (key) => {
    Alert.alert('Remove', `Remove ${METHOD_TYPES.find(m => m.key === key)?.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = { ...methods };
          delete updated[key];
          const newDefault = defaultMethod === key ? Object.keys(updated)[0] || null : defaultMethod;
          setMethods(updated);
          setDefaultMethod(newDefault);
          await save(updated, newDefault);
        },
      },
    ]);
  };

  const handleSetDefault = async (key) => {
    setDefaultMethod(key);
    await save(methods, key);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.keys(methods).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Methods</Text>
            <View style={styles.menuGroup}>
              {METHOD_TYPES.filter(m => methods[m.key]).map((m, i) => (
                <View key={m.key} style={[styles.methodRow, i > 0 && styles.rowBorder]}>
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodSub}>
                      {m.key === 'card'
                        ? `•••• ${methods[m.key].cardNumber}  ${methods[m.key].expiry}`
                        : methods[m.key].phone}
                    </Text>
                  </View>
                  {defaultMethod === m.key
                    ? <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
                    : (
                      <TouchableOpacity onPress={() => handleSetDefault(m.key)} style={styles.setDefaultBtn}>
                        <Text style={styles.setDefaultText}>Set default</Text>
                      </TouchableOpacity>
                    )}
                  <TouchableOpacity onPress={() => handleRemove(m.key)} style={{ paddingHorizontal: 4 }}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Payment Method</Text>
          <View style={styles.menuGroup}>
            {METHOD_TYPES.filter(m => !methods[m.key]).map((m, i, arr) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.addRow, i < arr.length - 1 && styles.rowBorder]}
                onPress={() => handleAdd(m.key)}
              >
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                <Text style={styles.addRowLabel}>{m.label}</Text>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            ))}
            {METHOD_TYPES.every(m => methods[m.key]) && (
              <View style={styles.addRow}>
                <Text style={styles.allAddedText}>All payment methods added ✓</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              Add {METHOD_TYPES.find(m => m.key === modal)?.label}
            </Text>
            {modal === 'card' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Card Number"
                  placeholderTextColor={COLORS.textMuted}
                  value={input.cardNumber}
                  onChangeText={t => setInput(p => ({ ...p, cardNumber: t }))}
                  keyboardType="numeric"
                  maxLength={19}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="MM/YY"
                    placeholderTextColor={COLORS.textMuted}
                    value={input.expiry}
                    onChangeText={t => setInput(p => ({ ...p, expiry: t }))}
                    maxLength={5}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor={COLORS.textMuted}
                    value={input.cvv}
                    onChangeText={t => setInput(p => ({ ...p, cvv: t }))}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Phone Number e.g. +2547XXXXXXXX"
                placeholderTextColor={COLORS.textMuted}
                value={input.phone}
                onChangeText={t => setInput(p => ({ ...p, phone: t }))}
                keyboardType="phone-pad"
              />
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveMethod}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  methodInfo: { flex: 1 },
  methodLabel: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  methodSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  defaultBadge: {
    backgroundColor: 'rgba(232,160,32,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  defaultText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  setDefaultBtn: { paddingHorizontal: 8 },
  setDefaultText: { color: COLORS.textMuted, fontSize: 11 },
  addRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  addRowLabel: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '600' },
  allAddedText: { color: COLORS.textMuted, fontSize: 14, padding: 4 },
  input: {
    backgroundColor: COLORS.dark, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, color: COLORS.white,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  modalSave: {
    flex: 1, borderRadius: 12, backgroundColor: COLORS.gold,
    paddingVertical: 12, alignItems: 'center',
  },
  modalSaveText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
