import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

const OTP_LENGTH = 4;

export default function AuthScreen({ route, navigation }) {
  const { role } = route.params;
  const { signUp } = useAuth();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabel = role === 'buyer' ? 'Buyer' : 'Seller';
  const roleEmoji = role === 'buyer' ? '🛍️' : '📡';

  const handleSendOtp = () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Enter your name', 'Please enter at least 2 characters for your name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      Alert.alert('Enter phone number', 'Please enter a valid phone number.');
      return;
    }
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length < OTP_LENGTH) {
      Alert.alert('Enter OTP', `Please enter the ${OTP_LENGTH}-digit code sent to your phone.`);
      return;
    }
    // In production, verify with backend. For now, accept any 4-digit code.
    setLoading(true);
    try {
      await signUp({ name: name.trim(), phone: phone.trim(), role });
      // RootNavigator automatically transitions when user context updates
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (step === 'otp') setStep('details');
          else navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.roleEmoji}>{roleEmoji}</Text>
          <Text style={styles.title}>
            {step === 'details' ? `Join as ${roleLabel}` : 'Verify Phone'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'details'
              ? 'Enter your details to get started'
              : `Enter the 4-digit code sent to\n${phone}`}
          </Text>
        </View>

        {step === 'details' ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
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
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+234 812 345 6789"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}>
              <Text style={styles.primaryBtnText}>Send OTP Code →</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing you agree to AfriLive's Terms & Privacy Policy
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • •"
                placeholderTextColor={COLORS.border}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Continue →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => {}}>
              <Text style={styles.resendText}>Didn't get the code? Resend</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Role-specific benefits */}
        <View style={styles.benefits}>
          {role === 'buyer' ? (
            <>
              <BenefitRow icon="flash" text="Buy in seconds without leaving the stream" />
              <BenefitRow icon="location" text="SmartAddress — no typing your address" />
              <BenefitRow icon="wallet" text="Pay with M-Pesa, Airtel or MTN MoMo" />
            </>
          ) : (
            <>
              <BenefitRow icon="radio" text="Go live and sell to thousands instantly" />
              <BenefitRow icon="trending-up" text="Real-time earnings dashboard" />
              <BenefitRow icon="bicycle" text="Automatic delivery dispatch via SmartAddress" />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BenefitRow = ({ icon, text }) => (
  <View style={styles.benefitRow}>
    <View style={styles.benefitIcon}>
      <Ionicons name={icon} size={16} color={COLORS.gold} />
    </View>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: {
    marginTop: 56,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: 32, marginBottom: 36 },
  roleEmoji: { fontSize: 44, marginBottom: 12 },
  title: { color: COLORS.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  form: { marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.white, fontSize: 16 },
  otpContainer: { alignItems: 'center', marginVertical: 16 },
  otpInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 16,
    width: 200,
    height: 70,
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
  termsText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  resendBtn: { alignItems: 'center', marginTop: 16 },
  resendText: { color: COLORS.gold, fontSize: 14 },
  benefits: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 24, gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
});
