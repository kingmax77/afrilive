import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const WHATSAPP_NUMBER = '+254700000000';
const SUPPORT_EMAIL = 'support@afrilivemarketplace.com';

const FAQ = [
  {
    q: 'How does my SmartAddress code work?',
    a: 'Your SmartAddress code (e.g. BXR-204-17) is linked to a GPS pin you dropped on the map. When you shop on AfriLive, delivery riders use this code to find your exact location — no need to type out directions.',
  },
  {
    q: 'Can I have more than one address?',
    a: 'Yes. You can save multiple addresses (home, office, etc.) and mark one as primary. Your primary address is used automatically at checkout.',
  },
  {
    q: 'My order is stuck — what do I do?',
    a: 'Check the Parcel Tracking tab for live updates. If your order shows "In Transit" for more than 24 hours with no update, contact us on WhatsApp and share your order ID.',
  },
  {
    q: 'How do I become a delivery rider?',
    a: 'Go to your Profile and tap "Add Rider Account". You\'ll need to provide your vehicle details and a valid ID for verification.',
  },
  {
    q: 'Is my location data private?',
    a: 'Your address pin is only shared with verified delivery riders assigned to your order. We never sell your location data to third parties.',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const openWhatsApp = async () => {
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER.replace('+', '')}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp not installed', 'Please install WhatsApp or contact us at ' + SUPPORT_EMAIL);
    }
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=SmartAddress Support`).catch(() => {
      Alert.alert('Could not open email', 'Please email us at ' + SUPPORT_EMAIL);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Contact cards */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={[styles.contactIcon, { backgroundColor: `${colors.whatsapp}20` }]}>
              <Ionicons name="logo-whatsapp" size={26} color={colors.whatsapp} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactSub}>Fastest response</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openEmail} activeOpacity={0.8}>
            <View style={[styles.contactIcon, { backgroundColor: colors.goldFaded }]}>
              <Ionicons name="mail-outline" size={26} color={colors.gold} />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactSub}>Within 24 hours</Text>
          </TouchableOpacity>
        </View>

        {/* Hours */}
        <View style={styles.hoursCard}>
          <Ionicons name="time-outline" size={18} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursTitle}>Support Hours</Text>
            <Text style={styles.hoursSub}>Monday – Saturday · 8:00 AM – 8:00 PM (EAT/WAT)</Text>
          </View>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQ.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  contactRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16 },
  contactCard: {
    flex: 1, backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
    alignItems: 'center', paddingVertical: 20, gap: 8,
  },
  contactIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: { fontSize: 14, fontWeight: '700', color: colors.white },
  contactSub: { fontSize: 12, color: colors.textMuted },
  hoursCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.darkCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.darkBorder,
    padding: 14,
  },
  hoursTitle: { fontSize: 13, fontWeight: '700', color: colors.white },
  hoursSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  faqList: {
    marginHorizontal: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder, overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1, borderColor: colors.darkBorder,
    gap: 8,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.white, lineHeight: 20 },
  faqA: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
