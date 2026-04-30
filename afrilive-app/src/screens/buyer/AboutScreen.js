import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const TOS_TEXT = `Terms of Service

Last updated: January 2025

By using AfriLive Market, you agree to these terms.

1. Use of the Platform
AfriLive is a live commerce platform connecting sellers and buyers across Africa. Users must be 18 or older to make purchases or go live.

2. Payments
All payments are processed securely via Paystack, Flutterwave, or M-Pesa Daraja. AfriLive charges a 5% platform fee on completed sales.

3. Delivery
Orders are dispatched via Sendy or Kwik after payment confirmation. Delivery times vary by region.

4. Refunds
Refund requests must be submitted within 24 hours of delivery via support@afrilive.com.

5. Content
Sellers are responsible for the accuracy of product descriptions and prices. AfriLive reserves the right to remove any listing that violates our community standards.

6. Termination
AfriLive reserves the right to suspend or terminate accounts that violate these terms.`;

const PRIVACY_TEXT = `Privacy Policy

Last updated: January 2025

1. Data We Collect
- Phone number and name (for authentication)
- SmartAddress codes and GPS coordinates (for delivery)
- Order history (for order management)
- Payment method metadata (no full card numbers stored)

2. How We Use Your Data
- To facilitate orders and delivery
- To send relevant push notifications
- To improve our recommendation algorithms
- We never sell your data to third parties

3. Data Retention
Account data is retained while your account is active. Request deletion at support@afrilive.com.

4. Security
All data is encrypted in transit (TLS 1.3) and at rest. Passwords are never stored in plaintext.

5. Contact
privacy@afrilive.com`;

function TextModal({ title, body, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[mStyles.container, { paddingTop: insets.top }]}>
        <View style={mStyles.header}>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={mStyles.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={mStyles.body}>{body}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  body: { color: COLORS.textMuted, fontSize: 13, lineHeight: 22 },
});

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState(null);

  const items = [
    { label: 'App Version', value: '1.0.0', icon: 'information-circle-outline' },
    { label: 'Terms of Service', action: () => setModal('tos'), icon: 'document-text-outline' },
    { label: 'Privacy Policy', action: () => setModal('privacy'), icon: 'shield-outline' },
    { label: 'Open Source Licenses', action: () => setModal('licenses'), icon: 'code-slash-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About AfriLive</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🌍</Text>
          <Text style={styles.appName}>AfriLive Market</Text>
          <Text style={styles.tagline}>Live commerce for Africa</Text>
        </View>

        <View style={styles.menuGroup}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, i < items.length - 1 && styles.rowBorder]}
              onPress={item.action}
              disabled={!item.action}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.value
                ? <Text style={styles.rowValue}>{item.value}</Text>
                : <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>Made for Africa 🌍 · AfriLive v1.0.0</Text>
      </ScrollView>

      {modal === 'tos' && <TextModal title="Terms of Service" body={TOS_TEXT} onClose={() => setModal(null)} />}
      {modal === 'privacy' && <TextModal title="Privacy Policy" body={PRIVACY_TEXT} onClose={() => setModal(null)} />}
      {modal === 'licenses' && (
        <TextModal
          title="Open Source Licenses"
          body="React Native (MIT)\nExpo SDK (MIT)\nReact Navigation (MIT)\n@expo/vector-icons (MIT)\nexpo-linear-gradient (MIT)\nexpo-image-picker (MIT)\nAsyncStorage (MIT)\n\nFull license texts available at github.com/afrilive."
          onClose={() => setModal(null)}
        />
      )}
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
  logoWrap: { alignItems: 'center', paddingVertical: 32 },
  logoEmoji: { fontSize: 56, marginBottom: 12 },
  appName: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  tagline: { color: COLORS.textMuted, fontSize: 14 },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 32,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowValue: { color: COLORS.textMuted, fontSize: 14 },
  footer: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
