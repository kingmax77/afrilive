import React, { useState, useRef, useEffect } from 'react';
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
import { sendOTP, verifyOTP } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../services/api';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OTPScreen({ route, navigation }) {
  const { phone, devOtp: initialDevOtp } = route.params;
  const { signIn } = useAuth();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [devOtp, setDevOtp] = useState(initialDevOtp || null);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const enteredOtp = digits.join('');

  const handleDigitChange = (text, idx) => {
    const val = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, idx) => {
    if (nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      setCountdown(RESEND_SECONDS);
      const res = await sendOTP(phone);
      if (res.data?.otp) setDevOtp(res.data.otp);
    } catch {
      Alert.alert('Error', 'Could not resend OTP. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (enteredOtp.length < OTP_LENGTH) {
      Alert.alert('Incomplete code', `Please enter all ${OTP_LENGTH} digits.`);
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP(phone, enteredOtp);
      const { token, user, isNewUser } = res.data;
      const roles = user?.roles || [];

      if (isNewUser || !roles.length) {
        // New user or existing user with no roles — go to Register to pick a role
        await AsyncStorage.setItem(TOKEN_KEY, token);
        navigation.navigate('Register', { phone, token, isNewUser: !!isNewUser, apiUser: user });
      } else if (roles.length === 1) {
        // Single-role user — sign in and go straight to their home screen
        await signIn(token, user);
      } else {
        // Multi-role user — let them choose which mode to enter
        await AsyncStorage.setItem(TOKEN_KEY, token);
        navigation.navigate('RoleSwitcher', { token, apiUser: user });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code. Please try again.';
      Alert.alert('Verification failed', Array.isArray(msg) ? msg.join('\n') : msg);
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
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        {/* Dev mode OTP banner */}
        {devOtp && (
          <View style={styles.devBanner}>
            <Ionicons name="bug-outline" size={16} color={COLORS.dark} />
            <Text style={styles.devBannerText}>Dev mode: OTP is {devOtp}</Text>
          </View>
        )}

        {/* 6-digit boxes */}
        <View style={styles.boxRow}>
          {Array(OTP_LENGTH).fill(null).map((_, idx) => (
            <TextInput
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              style={[styles.box, digits[idx] ? styles.boxFilled : null]}
              value={digits[idx]}
              onChangeText={(t) => handleDigitChange(t, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              autoFocus={idx === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.verifyBtn, (loading || enteredOtp.length < OTP_LENGTH) && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || enteredOtp.length < OTP_LENGTH}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.dark} />
          ) : (
            <Text style={styles.verifyBtnText}>Verify →</Text>
          )}
        </TouchableOpacity>

        {/* Resend / countdown */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>Resend code in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Didn't get the code? Resend →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.dark },
  scroll:            { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn:           { marginTop: 56, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  header:            { marginTop: 32, marginBottom: 32 },
  emoji:             { fontSize: 44, marginBottom: 12 },
  title:             { color: COLORS.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle:          { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  phoneHighlight:    { color: COLORS.gold, fontWeight: '700' },
  devBanner:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 24 },
  devBannerText:     { color: COLORS.dark, fontSize: 14, fontWeight: '700' },
  boxRow:            { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  box:               { width: 46, height: 58, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, color: COLORS.white, fontSize: 24, fontWeight: '800' },
  boxFilled:         { borderColor: COLORS.gold },
  verifyBtn:         { backgroundColor: COLORS.gold, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText:     { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
  resendRow:         { alignItems: 'center' },
  countdownText:     { color: COLORS.textMuted, fontSize: 14 },
  resendText:        { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
});
