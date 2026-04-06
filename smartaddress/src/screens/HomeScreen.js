import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { AddressContext } from '../context/AddressContext';
import AddressCard from '../components/AddressCard';
import ShareModal from '../components/ShareModal';
import DeliveryConfidenceScore from '../components/DeliveryConfidenceScore';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { role, userName } = useContext(AuthContext);
  const { addresses, primaryAddress, primaryId, setPrimary } = useContext(AddressContext);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareAddress, setShareAddress] = useState(null);

  const isRider = role === 'rider';
  const greeting = getGreeting();

  const openShare = (addr) => {
    setShareAddress(addr);
    setShareVisible(true);
  };

  const handleSetPrimary = (addr) => {
    Alert.alert(
      'Set as Primary?',
      `Make "${addr.label}" (${addr.code}) your primary address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Primary',
          onPress: () => setPrimary(addr.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="location" size={18} color={colors.dark} />
          </View>
          <Text style={styles.appName}>SmartAddress</Text>
        </View>
        <Text style={styles.greeting}>
          {greeting}, {userName?.split(' ')[0] || (isRider ? 'Rider' : 'there')} 👋
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isRider ? (
          <RiderHomeView />
        ) : primaryAddress ? (
          <>
            {/* ── Primary address card — tap opens share directly ── */}
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>YOUR DIGITAL ADDRESS</Text>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>⭐ Primary</Text>
                </View>
              </View>

              {/* Card taps → Share modal */}
              <AddressCard
                address={primaryAddress}
                onPress={() => openShare(primaryAddress)}
                showCopy
              />
            </View>

            {/* Confidence score */}
            <View style={styles.confidenceCard}>
              <DeliveryConfidenceScore address={primaryAddress} compact={false} />
            </View>

            {/* ── Quick actions: 3 tiles (Details removed) ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              <View style={styles.actionsRow}>
                <QuickAction
                  icon="qr-code-outline"
                  label="QR Code"
                  bg={colors.goldFaded}
                  iconColor={colors.gold}
                  onPress={() => navigation.navigate('AddressDetail', { addressId: primaryAddress.id })}
                />
                <QuickAction
                  icon="share-social-outline"
                  label="Share"
                  bg="#075E5420"
                  iconColor="#25D366"
                  onPress={() => openShare(primaryAddress)}
                />
                <QuickAction
                  icon="eye-outline"
                  label="Rider View"
                  bg={colors.greenFaded}
                  iconColor={colors.green}
                  onPress={() => navigation.navigate('SharedAddress', { addressId: primaryAddress.id })}
                />
              </View>
            </View>

            {/* ── All saved addresses ── */}
            {addresses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  ALL ADDRESSES ({addresses.length})
                </Text>
                {addresses.map((addr) => {
                  const isPrimary = addr.id === primaryId;
                  return (
                    /* Tap whole card → full details */
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.addressListItem,
                        isPrimary && styles.addressListItemPrimary,
                      ]}
                      onPress={() => navigation.navigate('AddressDetail', { addressId: addr.id })}
                      activeOpacity={0.75}
                    >
                      {/* Star / dot indicator */}
                      {isPrimary ? (
                        <Text style={styles.starIcon}>⭐</Text>
                      ) : (
                        <View style={styles.listDot} />
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listCode, isPrimary && styles.listCodePrimary]}>
                          {addr.code}
                        </Text>
                        <Text style={styles.listLabel}>{addr.label}</Text>
                      </View>

                      {/* "Set Primary" button on non-primary addresses */}
                      {!isPrimary && (
                        <TouchableOpacity
                          style={styles.setPrimaryBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleSetPrimary(addr);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.setPrimaryText}>Set Primary</Text>
                        </TouchableOpacity>
                      )}

                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <ResidentEmptyState navigation={navigation} />
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      <ShareModal
        visible={shareVisible}
        onClose={() => { setShareVisible(false); setShareAddress(null); }}
        address={shareAddress ?? primaryAddress}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function RiderHomeView() {
  return (
    <View style={styles.riderHome}>
      <View style={styles.riderBadge}>
        <Ionicons name="bicycle" size={40} color={colors.green} />
      </View>
      <Text style={styles.riderHomeTitle}>Delivery Rider Dashboard</Text>
      <Text style={styles.riderHomeDesc}>
        Head to the Active Delivery tab to see your assigned deliveries. Your stats and history will appear here.
      </Text>
      <View style={styles.riderStatsRow}>
        {[{ label: 'Today', val: '0' }, { label: 'This Week', val: '0' }, { label: 'Total', val: '0' }].map((s, i) => (
          <View key={i} style={styles.riderStat}>
            <Text style={styles.riderStatVal}>{s.val}</Text>
            <Text style={styles.riderStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResidentEmptyState({ navigation }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.illustration}>
        <View style={styles.illustrationMap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={`h${i}`} style={[styles.gridLine, { top: 28 + i * 28 }]} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: 28 + i * 28 }]} />
          ))}
        </View>
        <View style={styles.illustrationPin}>
          <Ionicons name="location" size={52} color={colors.gold} />
        </View>
        <View style={styles.codeBubble}>
          <Text style={styles.codeBubbleText}>BXR-204-17</Text>
        </View>
      </View>

      <Text style={styles.emptyTitle}>No Digital Address Yet</Text>
      <Text style={styles.emptyDesc}>
        Get a unique code like{' '}
        <Text style={{ color: colors.gold, fontFamily: 'monospace', fontWeight: '700' }}>BXR-204-17</Text>
        {' '}that works anywhere in Africa — even without a street address.
      </Text>

      <View style={styles.featureList}>
        {[
          'Works without formal street addresses',
          'Share via WhatsApp or SMS instantly',
          'Riders see photos, gate color & arrival guide',
          'Takes less than 2 minutes to set up',
        ].map((text, i) => (
          <View key={i} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={17} color={colors.gold} />
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('Create')}
        activeOpacity={0.85}
      >
        <Ionicons name="location" size={22} color={colors.dark} />
        <Text style={styles.createBtnText}>Create My Address</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>Location data is stored only on this device.</Text>
    </View>
  );
}

function QuickAction({ icon, label, bg, iconColor, onPress }) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderColor: colors.darkBorder,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 9, backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  appName: { fontSize: 20, fontWeight: '800', color: colors.white },
  greeting: { fontSize: 14, color: colors.textSecondary, marginLeft: 42 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  section: { paddingHorizontal: 20, paddingTop: 22, gap: 12 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  primaryBadge: {
    backgroundColor: colors.goldFaded,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${colors.gold}40`,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: '700', color: colors.gold },

  // Confidence
  confidenceCard: {
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: colors.darkCard,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
  },

  // 3-tile actions row
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionTile: {
    flex: 1, backgroundColor: colors.darkCard,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.white },

  // Address list
  addressListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.darkCard, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  addressListItemPrimary: {
    borderColor: `${colors.gold}50`,
    backgroundColor: `${colors.gold}08`,
  },
  starIcon: { fontSize: 16, lineHeight: 20 },
  listDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.darkBorder },
  listCode: {
    fontSize: 14, fontWeight: '700', color: colors.textSecondary,
    fontFamily: 'monospace', letterSpacing: 1,
  },
  listCodePrimary: { color: colors.gold },
  listLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  setPrimaryBtn: {
    backgroundColor: colors.darkSurface,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.darkBorder,
    marginRight: 4,
  },
  setPrimaryText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },

  // Rider home
  riderHome: { paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', gap: 16 },
  riderBadge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.greenFaded, borderWidth: 2, borderColor: `${colors.green}50`,
    justifyContent: 'center', alignItems: 'center',
  },
  riderHomeTitle: { fontSize: 20, fontWeight: '800', color: colors.white, textAlign: 'center' },
  riderHomeDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  riderStatsRow: {
    flexDirection: 'row', gap: 24,
    backgroundColor: colors.darkCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.darkBorder, alignSelf: 'stretch',
    justifyContent: 'space-around', marginTop: 8,
  },
  riderStat: { alignItems: 'center', gap: 4 },
  riderStatVal: { fontSize: 22, fontWeight: '800', color: colors.white },
  riderStatLabel: { fontSize: 12, color: colors.textMuted },

  // Empty state
  emptyState: { paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' },
  illustration: {
    width: 200, height: 170, marginBottom: 28, alignItems: 'center',
    justifyContent: 'flex-end', position: 'relative',
  },
  illustrationMap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 28,
    backgroundColor: colors.darkCard, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.darkBorder },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.darkBorder },
  illustrationPin: { position: 'absolute', bottom: 18 },
  codeBubble: {
    position: 'absolute', top: 10, right: -12,
    backgroundColor: colors.gold, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  codeBubbleText: { fontSize: 11, fontWeight: '800', color: colors.dark, fontFamily: 'monospace', letterSpacing: 1 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.white, textAlign: 'center', marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  featureList: { alignSelf: 'stretch', gap: 10, marginBottom: 28 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.gold, paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 14, alignSelf: 'stretch', justifyContent: 'center', marginBottom: 14,
  },
  createBtnText: { fontSize: 17, fontWeight: '700', color: colors.dark },
  legalText: { fontSize: 12, color: colors.textMuted },
});
