import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/colors';
import { createProduct, updateProduct } from '../../services/api';

const CATEGORIES = ['Fashion', 'Electronics', 'Food', 'Beauty', 'Shoes', 'Other'];

const GRADIENT_OPTIONS = [
  ['#4A0080', '#9B1DE8'],
  ['#212121', '#424242'],
  ['#B71C1C', '#C62828'],
  ['#E65100', '#EF6C00'],
  ['#1A237E', '#283593'],
  ['#004D40', '#00897B'],
];

export default function AddEditProductScreen({ route, navigation }) {
  const { product } = route.params;
  const insets = useSafeAreaInsets();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState(product?.category || 'Fashion');
  const [description, setDescription] = useState(product?.description || '');
  const [stock, setStock] = useState(
    (product?.stockCount ?? product?.stock)?.toString() || ''
  );
  const [gradient, setGradient] = useState(product?.gradient || GRADIENT_OPTIONS[0]);
  const [photoUri, setPhotoUri] = useState(product?.photos?.[0] || null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to upload a product photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Product name required'); return; }
    if (!price.trim() || isNaN(Number(price))) { Alert.alert('Enter a valid price'); return; }
    if (!stock.trim() || isNaN(Number(stock))) { Alert.alert('Enter valid stock quantity'); return; }

    setSaving(true);
    try {
      // Only send fields the backend DTO accepts — no gradient, stock→stockCount
      const payload = {
        name:        name.trim(),
        price:       Number(price),
        category,
        description: description.trim() || undefined,
        stockCount:  Number(stock),
        ...(photoUri ? { photos: [photoUri] } : {}),
      };
      if (isEdit) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not save product. Please try again.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Photo preview + picker */}
        <View style={styles.photoSection}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <LinearGradient colors={gradient} style={styles.photoPreview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 48 }}>🛍️</Text>
            </LinearGradient>
          )}
          <TouchableOpacity style={styles.uploadPhotoBtn} onPress={handlePickPhoto}>
            <Ionicons name="camera-outline" size={18} color={COLORS.gold} />
            <Text style={styles.uploadPhotoBtnText}>{photoUri ? 'Change Photo' : 'Upload Photo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Card Color</Text>
          <View style={styles.gradientRow}>
            {GRADIENT_OPTIONS.map((g, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setGradient(g)}
                style={[styles.gradientOption, gradient === g && styles.gradientOptionActive]}
              >
                <LinearGradient colors={g} style={styles.gradientSwatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form fields */}
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Ankara Dress" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Price (₦) *</Text>
              <TextInput style={styles.input} placeholder="18500" placeholderTextColor={COLORS.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput style={styles.input} placeholder="10" placeholderTextColor={COLORS.textMuted} value={stock} onChangeText={setStock} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.categoryChip, category === cat && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product — material, sizes, what's included..."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.dark} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.dark} />
              <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add to Catalogue'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  photoSection: { alignItems: 'center', marginBottom: 20 },
  photoPreview: { width: 130, height: 130, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  uploadPhotoBtnText: { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: COLORS.white, fontSize: 15 },
  textArea: { height: 100, paddingTop: 12 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  gradientRow: { flexDirection: 'row', gap: 10 },
  gradientOption: { padding: 3, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  gradientOptionActive: { borderColor: COLORS.gold },
  gradientSwatch: { width: 38, height: 38, borderRadius: 10 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  categoryChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: COLORS.dark },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.gold, borderRadius: 14, height: 54, marginTop: 8 },
  saveBtnText: { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
});
