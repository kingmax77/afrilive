import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

const STORAGE_KEY = '@afrilive_delivery_prefs';

const PARTNERS = [
  { key: 'sendy', label: 'Sendy', sub: 'Last-mile, Kenya-first', emoji: '🚚' },
  { key: 'kwik', label: 'Kwik', sub: 'On-demand, Nigeria-first', emoji: '🛵' },
  { key: 'glovo', label: 'Glovo', sub: 'Pan-Africa coverage', emoji: '🟡' },
  { key: 'local', label: 'Local Pickup', sub: 'Buyer collects in person', emoji: '🏪' },
];

const RADII = ['5km', '10km', '25km', '50km', 'Nationwide'];

const DEFAULTS = {
  partners: { sendy: true, kwik: true, glovo: false, local: false },
  radius: '25km',
};

export default function DeliveryPreferencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setPrefs({ ...DEFAULTS, ...JSON.parse(val) });
    });
  }, []);

  const togglePartner = (key) =>
    setPrefs(p => ({ ...p, partners: { ...p.partners, [key]: !p.partners[key] } }));

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Delivery Partners</Text>
        <View style={styles.menuGroup}>
          {PARTNERS.map((p, i) => (
            <View key={p.key} style={[styles.row, i < PARTNERS.length - 1 && styles.rowBorder]}>
              <Text style={styles.partnerEmoji}>{p.emoji}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{p.label}</Text>
                <Text style={styles.rowSub}>{p.sub}</Text>
              </View>
              <Switch
                value={prefs.partners[p.key]}
                onValueChange={() => togglePartner(p.key)}
                trackColor={{ false: COLORS.border, true: COLORS.gold }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Delivery Radius</Text>
        <View style={styles.menuGroup}>
          {RADII.map((r, i) => (
            <TouchableOpacity
              key={r}
              style={[styles.row, i < RADII.length - 1 && styles.rowBorder]}
              onPress={() => setPrefs(p => ({ ...p, radius: r }))}
            >
              <View style={styles.radioCircle}>
                {prefs.radius === r && <View style={styles.radioFilled} />}
              </View>
              <Text style={styles.rowLabel}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Preferences'}</Text>
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
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  partnerEmoji: { fontSize: 22 },
  rowContent: { flex: 1 },
  rowLabel: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  radioFilled: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold,
  },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
