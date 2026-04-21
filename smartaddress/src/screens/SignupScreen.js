import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { sendOtp } from '../services/api';
import { colors } from '../theme/colors';

const ROLES = [
  {
    id: 'buyer',
    title: 'Resident / Buyer',
    subtitle: 'I want to create my SmartAddress and receive deliveries',
    icon: 'home',
    iconBg: colors.goldFaded,
    iconColor: colors.gold,
    borderActive: colors.gold,
  },
  {
    id: 'rider',
    title: 'Delivery Rider',
    subtitle: 'I deliver parcels and need to navigate to customer addresses',
    icon: 'bicycle',
    iconBg: colors.greenFaded,
    iconColor: colors.green,
    borderActive: colors.green,
  },
];

// ── Step 1: Phone number ──────────────────────────────────────────────────────

function PhoneStep({ onOtpSent }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const cleaned = phone.trim();
    if (cleaned.length < 9) {
      Alert.alert('Invalid number', 'Enter a valid phone number including country code (e.g. +254712345678).');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(cleaned);
      // In dev mode the backend returns the OTP in the response body
      onOtpSent(cleaned, res.otp ?? null);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Could not send OTP. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.heading}>Enter your phone number</Text>
      <Text style={styles.subheading}>
        We'll send a one-time code to verify your number.
      </Text>

      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>Phone Number</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="+254 712 345 678"
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoFocus
          maxLength={16}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, phone.trim().length < 9 && styles.continueBtnDisabled]}
        onPress={handleSend}
        disabled={loading || phone.trim().length < 9}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={colors.dark} />
          : <>
              <Text style={styles.continueBtnText}>Send Code</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.dark} />
            </>
        }
      </TouchableOpacity>
    </>
  );
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────

function OtpStep({ phone, devOtp, onVerified, onBack }) {
  const { loginWithOtp } = useContext(AuthContext);
  const [otp, setOtp] = useState(devOtp ?? '');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code we sent you.');
      return;
    }
    setLoading(true);
    try {
      const { isNewUser, isReturningUser } = await loginWithOtp(phone, otp.trim());
      onVerified(isNewUser, isReturningUser);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={onBack} style={styles.backLink}>
        <Ionicons name="arrow-back" size={18} color={colors.gold} />
        <Text style={styles.backLinkText}>Change number</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Enter the code</Text>
      <Text style={styles.subheading}>
        Sent to <Text style={{ color: colors.white }}>{phone}</Text>
      </Text>

      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>6-Digit Code</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="123456"
          placeholderTextColor={colors.textMuted}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        {devOtp && (
          <Text style={styles.devHint}>Dev mode — code pre-filled: {devOtp}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, otp.trim().length !== 6 && styles.continueBtnDisabled]}
        onPress={handleVerify}
        disabled={loading || otp.trim().length !== 6}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={colors.dark} />
          : <>
              <Text style={styles.continueBtnText}>Verify</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.dark} />
            </>
        }
      </TouchableOpacity>
    </>
  );
}

// ── Step 3: Name + Role (new users only) ─────────────────────────────────────

function RegisterStep({ phone, isReturningUser }) {
  const { roles, completeRegistration, addRole, switchActiveRole } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = selectedRole && name.trim().length >= 2;

  const handleRegister = async () => {
    if (!canContinue) return;

    // Normalize selected role to uppercase for comparison with context roles
    const normalizedSelected = selectedRole === 'rider' ? 'RIDER' : 'RESIDENT';
    const alreadyHasRole = roles?.includes(normalizedSelected);

    setLoading(true);
    try {
      if (alreadyHasRole) {
        // Role already exists — just switch to it, no API call needed
        await switchActiveRole(normalizedSelected.toLowerCase());
      } else {
        await completeRegistration(phone, name.trim(), selectedRole);
      }
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = selectedRole === 'rider' ? 'Rider' : selectedRole === 'buyer' ? 'Resident' : null;

  return (
    <>
      {isReturningUser && (
        <View style={styles.welcomeBackBanner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.welcomeBackText}>
            Welcome back!{roleLabel ? ` Adding ${roleLabel} access…` : ' Choose a role to continue.'}
          </Text>
        </View>
      )}
      <Text style={styles.heading}>Welcome! I am a...</Text>
      <Text style={styles.subheading}>
        Choose your role so we can set up the right experience for you.
      </Text>

      {ROLES.map((role) => {
        const isSelected = selectedRole === role.id;
        return (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              isSelected && { borderColor: role.borderActive, borderWidth: 2 },
            ]}
            onPress={() => setSelectedRole(role.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, isSelected && { borderColor: role.borderActive }]}>
              {isSelected && (
                <View style={[styles.radioInner, { backgroundColor: role.borderActive }]} />
              )}
            </View>
            <View style={[styles.roleIconBox, { backgroundColor: role.iconBg }]}>
              <Ionicons name={role.icon} size={28} color={role.iconColor} />
            </View>
            <View style={styles.roleTextBox}>
              <Text style={[styles.roleTitle, isSelected && { color: role.borderActive }]}>
                {role.title}
              </Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>Your Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Kingsley Obi"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={40}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        onPress={handleRegister}
        disabled={!canContinue || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={colors.dark} />
          : <>
              <Text style={styles.continueBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.dark} />
            </>
        }
      </TouchableOpacity>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'register'
  const [phone, setPhone] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const handleOtpSent = (phoneNumber, otp) => {
    setPhone(phoneNumber);
    setDevOtp(otp);
    setStep('otp');
  };

  const handleVerified = (isNewUser, returningUser) => {
    if (isNewUser) {
      setIsReturningUser(returningUser ?? false);
      setStep('register');
    }
    // If existing user with roles, AuthContext set role → navigator redirects automatically
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Ionicons name="location" size={28} color={colors.dark} />
            </View>
            <Text style={styles.appName}>SmartAddress</Text>
            <Text style={styles.appTagline}>Digital addressing for Africa</Text>
          </View>

          {step === 'phone' && (
            <PhoneStep onOtpSent={handleOtpSent} />
          )}
          {step === 'otp' && (
            <OtpStep
              phone={phone}
              devOtp={devOtp}
              onVerified={handleVerified}
              onBack={() => setStep('phone')}
            />
          )}
          {step === 'register' && (
            <RegisterStep phone={phone} isReturningUser={isReturningUser} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appName: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  appTagline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 8 },
  subheading: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backLinkText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
  devHint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkCard,
    borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: colors.darkBorder, gap: 12,
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  roleIconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleTextBox: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: colors.white, marginBottom: 4 },
  roleSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  nameSection: { marginTop: 8, marginBottom: 28, gap: 8 },
  nameLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  nameInput: {
    backgroundColor: colors.darkCard, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: colors.white,
    borderWidth: 1.5, borderColor: colors.darkBorder,
  },
  welcomeBackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.greenFaded,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.green}40`,
  },
  welcomeBackText: { fontSize: 13, fontWeight: '600', color: colors.green, flex: 1 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 14, marginBottom: 16,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { fontSize: 17, fontWeight: '700', color: colors.dark },
});
