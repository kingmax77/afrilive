import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const FAQS = [
  {
    q: 'How do I start a live stream?',
    a: 'Tap "Go Live" in the bottom tab, set your stream title and category, then tap "Start Stream". Your followers will be notified automatically.',
  },
  {
    q: 'When do I get paid?',
    a: 'Payouts are processed every Monday for the previous week\'s confirmed deliveries. You can request an early payout from the Profile tab.',
  },
  {
    q: 'How do I pin a product during a live?',
    a: 'While broadcasting, tap the product icon at the bottom of the screen. Select a product from your catalogue to pin it as a floating card for buyers.',
  },
  {
    q: 'What are AfriLive\'s fees?',
    a: 'AfriLive charges a 5% platform fee on each completed sale. Delivery costs are covered by the buyer at checkout.',
  },
  {
    q: 'How do I handle a dispute or refund?',
    a: 'Contact our seller support via WhatsApp or email with the order ID. Our team resolves disputes within 48 hours.',
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestion} onPress={() => setOpen(o => !o)}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </View>
  );
}

export default function SellerSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/254700000000?text=Hello%20AfriLive%20Seller%20Support').catch(() => {});
  };

  const openEmail = () => {
    Linking.openURL('mailto:sellers@afrilive.com?subject=Seller%20Support').catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={[styles.contactRow, styles.rowBorder]} onPress={openWhatsApp}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(0,166,81,0.15)' }]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp Support</Text>
                <Text style={styles.contactSub}>Dedicated seller support line</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(232,160,32,0.12)' }]}>
                <Text style={{ fontSize: 22 }}>✉️</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactSub}>sellers@afrilive.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller FAQs</Text>
          <View style={styles.faqGroup}>
            {FAQS.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.faqDivider} />}
                <FAQItem item={item} />
              </React.Fragment>
            ))}
          </View>
        </View>
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
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  contactSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  faqGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  faqItem: { padding: 14 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: '600' },
  faqA: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  faqDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
});
