import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function IDVerificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.green} />
          </View>
          <Text style={styles.statusTitle}>Verification Completed</Text>
          <Text style={styles.statusSub}>Your identity has been verified. You are authorized to go live and sell.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verified Details</Text>
          <View style={styles.card}>
            <View style={[styles.detailRow, styles.rowBorder]}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user?.name || 'Verified Name'}</Text>
            </View>
            <View style={[styles.detailRow, styles.rowBorder]}>
              <Text style={styles.detailLabel}>ID Type</Text>
              <Text style={styles.detailValue}>National ID Card</Text>
            </View>
            <View style={[styles.detailRow, styles.rowBorder]}>
              <Text style={styles.detailLabel}>Verification Date</Text>
              <Text style={styles.detailValue}>January 2025</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.certBtn}
          onPress={() => Alert.alert('Certificate', 'Your verification certificate will be emailed to your registered address.')}
        >
          <Ionicons name="document-text-outline" size={18} color={COLORS.gold} />
          <Text style={styles.certBtnText}>View Certificate</Text>
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
  statusCard: {
    backgroundColor: 'rgba(26,107,60,0.12)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(26,107,60,0.3)',
    padding: 28, alignItems: 'center', marginBottom: 24,
  },
  statusIcon: { marginBottom: 14 },
  statusTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  statusSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.textMuted, fontSize: 13 },
  detailValue: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(26,107,60,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  certBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14,
  },
  certBtnText: { color: COLORS.gold, fontSize: 15, fontWeight: '700' },
});
