import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRiderProfile, updateRiderProfile } from '../services/api';
import { colors } from '../theme/colors';

const VEHICLE_TYPES = [
  { key: 'MOTORCYCLE', label: 'Motorcycle', icon: 'bicycle' },
  { key: 'BICYCLE', label: 'Bicycle', icon: 'bicycle-outline' },
  { key: 'CAR', label: 'Car', icon: 'car-outline' },
  { key: 'VAN', label: 'Van / Minivan', icon: 'bus-outline' },
];

const DOC_ITEMS = [
  { key: 'nationalId', label: 'National ID / Passport', icon: 'card-outline', hint: 'Upload front of your ID' },
  { key: 'driverLicense', label: "Driver's License", icon: 'document-outline', hint: 'Upload front and back' },
  { key: 'insurance', label: 'Vehicle Insurance', icon: 'shield-checkmark-outline', hint: 'Upload proof of insurance' },
];

function DocUploadRow({ item }) {
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    Alert.alert('Upload Document', `Select source for "${item.label}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => setUploaded(true) },
      { text: 'Gallery', onPress: () => setUploaded(true) },
    ]);
  };

  return (
    <View style={styles.docRow}>
      <View style={styles.docIconBox}>
        <Ionicons name={item.icon} size={20} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docLabel}>{item.label}</Text>
        <Text style={styles.docHint}>{item.hint}</Text>
      </View>
      <TouchableOpacity
        style={[styles.uploadBtn, uploaded && styles.uploadBtnDone]}
        onPress={handleUpload}
        activeOpacity={0.8}
      >
        <Ionicons name={uploaded ? 'checkmark-circle' : 'cloud-upload-outline'} size={16} color={uploaded ? colors.green : colors.gold} />
        <Text style={[styles.uploadBtnText, uploaded && { color: colors.green }]}>
          {uploaded ? 'Uploaded' : 'Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function VehicleDocumentsScreen() {
  const [vehicleType, setVehicleType] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await getRiderProfile();
      setVehicleType(profile?.vehicleType ?? null);
      setLicensePlate(profile?.licensePlate ?? '');
    } catch {
      // Profile may not exist yet — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!vehicleType) {
      Alert.alert('Select Vehicle Type', 'Please select your vehicle type before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateRiderProfile({ vehicleType, licensePlate: licensePlate.trim() });
      Alert.alert('Saved', 'Your vehicle details have been updated.');
    } catch (e) {
      Alert.alert('Error', e?.message ?? 'Could not save details. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Vehicle type */}
        <Text style={styles.sectionTitle}>Vehicle Type</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => {
            const selected = vehicleType === v.key;
            return (
              <TouchableOpacity
                key={v.key}
                style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                onPress={() => setVehicleType(v.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={v.icon}
                  size={26}
                  color={selected ? colors.dark : colors.gold}
                />
                <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>
                  {v.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.dark} style={styles.selectedCheck} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* License plate */}
        <Text style={styles.sectionTitle}>License Plate</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="car-sport-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder="e.g. KAA 123A"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={12}
          />
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>Documents</Text>
        <View style={styles.docList}>
          {DOC_ITEMS.map((item, i) => (
            <View key={item.key} style={[i > 0 && styles.docBorder]}>
              <DocUploadRow item={item} />
            </View>
          ))}
        </View>

        <View style={styles.verificationNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.gold} />
          <Text style={styles.verificationNoteText}>
            Documents are reviewed within 1–2 business days. You'll receive a notification when verified.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.dark} />
            : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.dark} />
                <Text style={styles.saveBtnText}>Save Details</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16 },
  vehicleCard: {
    width: '47%', backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.darkBorder,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', gap: 8, position: 'relative',
  },
  vehicleCardSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  vehicleLabel: { fontSize: 13, fontWeight: '600', color: colors.white, textAlign: 'center' },
  vehicleLabelSelected: { color: colors.dark },
  selectedCheck: { position: 'absolute', top: 8, right: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16,
    backgroundColor: colors.darkCard, borderRadius: 12,
    borderWidth: 1, borderColor: colors.darkBorder,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: colors.white, fontWeight: '600' },
  docList: {
    marginHorizontal: 16,
    backgroundColor: colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.darkBorder, overflow: 'hidden',
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  docBorder: { borderTopWidth: 1, borderColor: colors.darkBorder },
  docIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  docLabel: { fontSize: 14, fontWeight: '600', color: colors.white },
  docHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: `${colors.gold}50`,
    backgroundColor: colors.goldFaded,
  },
  uploadBtnDone: { borderColor: `${colors.green}50`, backgroundColor: `${colors.green}15` },
  uploadBtnText: { fontSize: 12, fontWeight: '600', color: colors.gold },
  verificationNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: colors.darkCard, borderRadius: 12,
    borderWidth: 1, borderColor: `${colors.gold}30`,
    padding: 14,
  },
  verificationNoteText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, borderRadius: 14,
    paddingVertical: 15, marginHorizontal: 16, marginTop: 24,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});
