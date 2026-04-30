import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const APP_VERSION = '1.0.0';

const HOW_IT_WORKS = [
  { icon: 'location', title: 'Drop a Pin', desc: 'Open the map and pin your exact location — anywhere, even without a street address.' },
  { icon: 'flag', title: 'Add Landmarks', desc: 'Describe your gate color, nearby landmark, and arrival instructions for the rider.' },
  { icon: 'barcode', title: 'Get Your Code', desc: 'The system generates a unique SmartAddress code (e.g. BXR-204-17) tied to your pin.' },
  { icon: 'cart', title: 'Shop on AfriLive', desc: 'Your code auto-fills at checkout on AfriLive — riders navigate directly to your door.' },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Logo + tagline */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Ionicons name="location" size={36} color={colors.dark} />
          </View>
          <Text style={styles.appName}>SmartAddress</Text>
          <Text style={styles.tagline}>Your location. Your code. Delivered.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* Part of AfriLive */}
        <View style={styles.partOfCard}>
          <Ionicons name="videocam" size={18} color={colors.gold} />
          <Text style={styles.partOfText}>Part of <Text style={{ color: colors.gold, fontWeight: '700' }}>AfriLive Market</Text> — live commerce for Africa</Text>
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsList}>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={[styles.step, i > 0 && styles.stepBorder]}>
              <View style={styles.stepIconBox}>
                <Ionicons name={step.icon} size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coverage */}
        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>Coverage</Text>
          <View style={styles.coverageRow}>
            <View style={styles.coverageItem}>
              <Ionicons name="location" size={16} color={colors.gold} />
              <Text style={styles.coverageItemText}>Kenya</Text>
            </View>
            <View style={styles.coverageItem}>
              <Ionicons name="location" size={16} color={colors.gold} />
              <Text style={styles.coverageItemText}>Nigeria</Text>
            </View>
            <View style={styles.coverageItem}>
              <Ionicons name="location" size={16} color={colors.gold} />
              <Text style={styles.coverageItemText}>Ghana</Text>
            </View>
          </View>
          <Text style={styles.coverageSub}>Expanding across Africa — anywhere a pin can be dropped.</Text>
        </View>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://afrilivemarketplace.com/terms').catch(() => {})}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://afrilivemarketplace.com/privacy').catch(() => {})}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2025 AfriLive Marketplace. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, gap: 8 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  appName: { fontSize: 26, fontWeight: '800', color: colors.white },
  tagline: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  versionBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, backgroundColor: colors.darkCard,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  versionText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  partOfCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: colors.darkCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.darkBorder,
    padding: 14,
  },
  partOfText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  stepsList: {
    marginHorizontal: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder, overflow: 'hidden',
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  stepBorder: { borderTopWidth: 1, borderColor: colors.darkBorder },
  stepIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  stepTitle: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 4 },
  stepDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  coverageCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
    padding: 16, gap: 10,
  },
  coverageTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  coverageRow: { flexDirection: 'row', gap: 16 },
  coverageItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coverageItemText: { fontSize: 13, color: colors.textSecondary },
  coverageSub: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  legalRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, marginTop: 28, marginBottom: 8,
  },
  legalLink: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  legalDot: { fontSize: 13, color: colors.textMuted },
  copyright: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
