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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const ROLES = [
  {
    id: 'resident',
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

export default function SignupScreen() {
  const { setRole } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = selectedRole && name.trim().length >= 2;

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    try {
      await setRole(selectedRole, name.trim());
    } finally {
      setLoading(false);
    }
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
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Ionicons name="location" size={28} color={colors.dark} />
            </View>
            <Text style={styles.appName}>SmartAddress</Text>
            <Text style={styles.appTagline}>Digital addressing for Africa</Text>
          </View>

          {/* Welcome */}
          <Text style={styles.heading}>Welcome! I am a...</Text>
          <Text style={styles.subheading}>
            Choose your role so we can set up the right experience for you.
          </Text>

          {/* Role cards */}
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
                {/* Selection indicator */}
                <View style={[
                  styles.radioOuter,
                  isSelected && { borderColor: role.borderActive }
                ]}>
                  {isSelected && (
                    <View style={[styles.radioInner, { backgroundColor: role.borderActive }]} />
                  )}
                </View>

                {/* Icon */}
                <View style={[styles.roleIconBox, { backgroundColor: role.iconBg }]}>
                  <Ionicons name={role.icon} size={28} color={role.iconColor} />
                </View>

                {/* Text */}
                <View style={styles.roleTextBox}>
                  <Text style={[styles.roleTitle, isSelected && { color: role.borderActive }]}>
                    {role.title}
                  </Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Name input */}
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

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {loading ? 'Setting up...' : 'Continue'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color={colors.dark} />}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your role is stored locally on this device only.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextBox: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  nameSection: {
    marginTop: 8,
    marginBottom: 28,
    gap: 8,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nameInput: {
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  privacyNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
