import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

const STORAGE_KEY = '@afrilive_seller_notifications';

const DEFAULTS = {
  newOrder: true,
  orderDispatched: true,
  orderDelivered: true,
  newFollower: true,
  streamReminder: false,
};

export default function SellerNotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setPrefs({ ...DEFAULTS, ...JSON.parse(val) });
    });
  }, []);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rows = [
    { key: 'newOrder', label: 'New Order Received', sub: 'When a buyer places an order in your stream' },
    { key: 'orderDispatched', label: 'Order Dispatched', sub: 'When rider picks up the order' },
    { key: 'orderDelivered', label: 'Order Delivered', sub: 'When delivery is confirmed' },
    { key: 'newFollower', label: 'New Follower', sub: 'When someone follows your store' },
    { key: 'streamReminder', label: 'Stream Reminder', sub: '30 minutes before a scheduled stream' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.menuGroup}>
          {rows.map((row, i) => (
            <View key={row.key} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowSub}>{row.sub}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={() => toggle(row.key)}
                trackColor={{ false: COLORS.border, true: COLORS.gold }}
                thumbColor={COLORS.white}
              />
            </View>
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
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowContent: { flex: 1 },
  rowLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
