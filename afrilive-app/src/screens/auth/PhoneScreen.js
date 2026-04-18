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
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { sendOTP } from '../../services/api';

const COUNTRIES = [
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria',      dialCode: '+234' },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya',        dialCode: '+254' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana',        dialCode: '+233' },
  { code: 'UG', flag: '🇺🇬', name: 'Uganda',       dialCode: '+256' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania',     dialCode: '+255' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroon',     dialCode: '+237' },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa', dialCode: '+27'  },
];

export default function PhoneScreen({ navigation }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const fullPhone = `${country.dialCode}${phone.replace(/^0/, '')}`;

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOTP(fullPhone);
      const devOtp = res.data?.otp || null;
      navigation.navigate('OTP', { phone: fullPhone, devOtp });
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send OTP. Check your number and try again.';
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
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Enter your number</Text>
          <Text style={styles.subtitle}>We'll send a one-time code to verify your phone</Text>
        </View>

        {/* Input row */}
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            {/* Country picker trigger */}
            <TouchableOpacity style={styles.countryBtn} onPress={() => setPickerVisible(true)}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.dialCode}>{country.dialCode}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Phone input */}
            <TextInput
              style={styles.phoneInput}
              placeholder="8012345678"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.dark} />
            ) : (
              <Text style={styles.sendBtnText}>Send OTP Code →</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing you agree to AfriLive's Terms & Privacy Policy
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <BenefitRow icon="flash"       text="Buy in seconds without leaving the stream" />
          <BenefitRow icon="location"    text="SmartAddress — no typing your address" />
          <BenefitRow icon="wallet"      text="Pay with M-Pesa, Airtel or MTN MoMo" />
        </View>
      </ScrollView>

      {/* Country picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPickerVisible(false)} />
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Select Country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(c) => c.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryRow, item.code === country.code && styles.countryRowActive]}
                onPress={() => { setCountry(item); setPickerVisible(false); }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dialCode}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={18} color={COLORS.gold} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  container:      { flex: 1, backgroundColor: COLORS.dark },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn:        { marginTop: 56, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  header:         { marginTop: 32, marginBottom: 36 },
  emoji:          { fontSize: 44, marginBottom: 12 },
  title:          { color: COLORS.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle:       { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  form:           { marginBottom: 32 },
  label:          { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  countryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, height: 54 },
  flag:           { fontSize: 22 },
  dialCode:       { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  phoneInput:     { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, height: 54, color: COLORS.white, fontSize: 16 },
  sendBtn:        { backgroundColor: COLORS.gold, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.7 },
  sendBtnText:    { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
  terms:          { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  benefits:       { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 24, gap: 14 },
  benefitRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center' },
  benefitText:    { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  // Modal
  modalBackdrop:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' },
  pickerTitle:    { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  countryRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  countryRowActive:{ backgroundColor: 'rgba(232,160,32,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  countryFlag:    { fontSize: 24 },
  countryName:    { color: COLORS.white, fontSize: 15, fontWeight: '600', flex: 1 },
  countryDial:    { color: COLORS.textMuted, fontSize: 14, marginRight: 4 },
});
