import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Go to the Orders tab and tap on any order to see real-time tracking via SmartAddress. You can also open the SmartAddress app for detailed rider location.',
  },
  {
    q: 'How do I pay for a product in a live stream?',
    a: 'Tap the product card on screen, then tap "Buy Now". Enter your SmartAddress code, select a payment method, and confirm. You\'ll receive an M-Pesa or MoMo prompt on your phone.',
  },
  {
    q: 'What is a SmartAddress code?',
    a: 'A SmartAddress code (e.g. LGS-204-17) is a unique location ID tied to your GPS pin. It lets delivery riders find you without a traditional street address.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refund requests must be made within 24 hours of delivery. Contact our support team via WhatsApp or email with your order ID and issue description.',
  },
  {
    q: 'How do I follow a seller?',
    a: 'Search for a seller and tap "Follow" on their profile. You\'ll be notified whenever they go live.',
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

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/254700000000?text=Hello%20AfriLive%20Support').catch(() => {});
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@afrilive.com?subject=AfriLive%20Support').catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={[styles.contactRow, styles.rowBorder]} onPress={openWhatsApp}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(0,166,81,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp Support</Text>
                <Text style={styles.contactSub}>Typically replies in under 1 hour</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(232,160,32,0.12)' }]}>
                <Text style={{ fontSize: 20 }}>✉️</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactSub}>support@afrilive.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
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
  contactIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
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
