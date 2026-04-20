import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { register } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const ROLES = [
  { id: 'BUYER',  label: 'Buyer',  emoji: '🛍️', desc: 'Browse live streams and buy instantly' },
  { id: 'SELLER', label: 'Seller', emoji: '📡', desc: 'Go live and sell to thousands across Africa' },
];

export default function RegisterScreen({ route, navigation }) {
  const { phone, isNewUser = true } = route.params;
  const { signIn } = useAuth();

  const [name, setName] = useState('');
  const [role, setRole] = useState('BUYER');
  const [loading, setLoading] = useState(false);

  const isAddingRole = !isNewUser;
  const loadingLabel = isAddingRole
    ? `Adding ${role === 'SELLER' ? 'Seller' : 'Buyer'} access to your account...`
    : 'Creating account...';

  const handleCreate = async () => {
    if (!isAddingRole && (!name.trim() || name.trim().length < 2)) {
      Alert.alert('Enter your name', 'Please enter at least 2 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(phone, name.trim() || undefined, role);
      const { token, user } = res.data;
      await signIn(token, user);
      // RootNavigator auto-transitions when user context updates
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create account. Please try again.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{isAddingRole ? '➕' : '👤'}</Text>
          <Text style={styles.title}>
            {isAddingRole ? 'Choose Your Role' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isAddingRole
              ? 'Select the role you want to add to your account'
              : 'Tell us a bit about yourself to get started'}
          </Text>
        </View>

        {/* Name input — only shown for new users */}
        {!isAddingRole && (
          <View style={styles.section}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Adaeze Obi"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Role selector */}
        <View style={styles.section}>
          <Text style={styles.label}>I am a…</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleCard, role === r.id && styles.roleCardActive]}
                onPress={() => setRole(r.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>
                  {r.label}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
                {role === r.id && (
                  <View style={styles.roleCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.dark} />
              <Text style={styles.loadingLabel}>{loadingLabel}</Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>
              {isAddingRole ? `Add ${role === 'SELLER' ? 'Seller' : 'Buyer'} Access →` : 'Create Account →'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to AfriLive's Terms & Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.dark },
  scroll:           { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn:          { marginTop: 56, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  header:           { marginTop: 32, marginBottom: 36 },
  emoji:            { fontSize: 44, marginBottom: 12 },
  title:            { color: COLORS.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle:         { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  section:          { marginBottom: 28 },
  label:            { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  inputIcon:        { marginRight: 12 },
  input:            { flex: 1, color: COLORS.white, fontSize: 16 },
  roleRow:          { flexDirection: 'row', gap: 12 },
  roleCard:         { flex: 1, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, borderRadius: 16, padding: 16, gap: 4, position: 'relative' },
  roleCardActive:   { borderColor: COLORS.gold, backgroundColor: 'rgba(232,160,32,0.07)' },
  roleEmoji:        { fontSize: 28, marginBottom: 4 },
  roleLabel:        { color: COLORS.textSecondary, fontSize: 15, fontWeight: '800' },
  roleLabelActive:  { color: COLORS.gold },
  roleDesc:         { color: COLORS.textMuted, fontSize: 11, lineHeight: 15, marginTop: 2 },
  roleCheck:        { position: 'absolute', top: 10, right: 10 },
  createBtn:        { backgroundColor: COLORS.gold, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  createBtnDisabled:{ opacity: 0.7 },
  createBtnText:    { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
  loadingRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingLabel:     { color: COLORS.dark, fontSize: 14, fontWeight: '700' },
  terms:            { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
