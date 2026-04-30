import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

const STORAGE_KEY = '@afrilive_store_profile';

export default function StoreProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    storeName: user?.name || '',
    bio: '',
    location: '',
    profilePhoto: null,
    bannerImage: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setForm(f => ({ ...f, ...JSON.parse(val) }));
    });
  }, []);

  const pickImage = async (field) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission needed', 'Photo library access is required to upload images.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'bannerImage' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setForm(f => ({ ...f, [field]: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.storeName.trim()) {
      return Alert.alert('Error', 'Store name is required.');
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      await updateUser({ name: form.storeName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.bannerPicker} onPress={() => pickImage('bannerImage')}>
          {form.bannerImage
            ? <Text style={styles.bannerPickerText}>Banner Selected ✓</Text>
            : (
              <View style={styles.bannerPickerInner}>
                <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.bannerPickerHint}>Tap to upload banner image</Text>
              </View>
            )}
        </TouchableOpacity>

        <View style={styles.avatarRow}>
          <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage('profilePhoto')}>
            <Text style={styles.avatarInitials}>
              {form.profilePhoto ? '✓' : (form.storeName.charAt(0) || 'S')}
            </Text>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color={COLORS.dark} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Store Name *</Text>
          <TextInput
            style={styles.input}
            value={form.storeName}
            onChangeText={v => setForm(f => ({ ...f, storeName: v }))}
            placeholder="Your store name"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Bio / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.bio}
            onChangeText={v => setForm(f => ({ ...f, bio: v }))}
            placeholder="Tell buyers about your store..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Store Location</Text>
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={v => setForm(f => ({ ...f, location: v }))}
            placeholder="e.g. Lagos Island, Nigeria"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={COLORS.dark} />
            : <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Profile'}</Text>}
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
  bannerPicker: {
    height: 100, backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  bannerPickerInner: { alignItems: 'center', gap: 6 },
  bannerPickerText: { color: COLORS.green, fontWeight: '700', fontSize: 14 },
  bannerPickerHint: { color: COLORS.textMuted, fontSize: 13 },
  avatarRow: { alignItems: 'center', marginBottom: 24 },
  avatarPicker: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    marginTop: -40,
  },
  avatarInitials: { color: COLORS.dark, fontSize: 28, fontWeight: '800' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.gold, borderWidth: 2, borderColor: COLORS.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, color: COLORS.white,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
