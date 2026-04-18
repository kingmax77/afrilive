import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const RoleCard = ({ icon, emoji, title, subtitle, gradient, onPress, delay }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient colors={gradient} style={styles.roleCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.roleEmoji}>{emoji}</Text>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>
          <View style={styles.roleArrow}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RoleScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#141414']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>
            <Text style={{ color: COLORS.white }}>Afri</Text>
            <Text style={{ color: COLORS.gold }}>Live</Text>
          </Text>
        </View>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>
          Choose how you want to use AfriLive Market
        </Text>
      </View>

      <View style={styles.cards}>
        <RoleCard
          emoji="🛍️"
          title="I am a Buyer"
          subtitle="Browse live streams, tap products and buy instantly with mobile money"
          gradient={['#1A1A2E', '#16213E', '#0F3460']}
          onPress={() => navigation.navigate('Phone')}
        />
        <RoleCard
          emoji="📡"
          title="I am a Seller"
          subtitle="Go live, showcase your products and sell to thousands of buyers across Africa"
          gradient={['#3D1A00', '#7B3A00', '#E8A020']}
          onPress={() => navigation.navigate('Phone')}
        />
      </View>

      <View style={styles.features}>
        {['🌍 Pan-Africa payments', '🛵 SmartAddress delivery', '📡 Live commerce'].map((f) => (
          <View key={f} style={styles.featureChip}>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cards: {
    gap: 16,
  },
  roleCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  roleCard: {
    padding: 28,
    borderRadius: 20,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  roleTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: '85%',
  },
  roleArrow: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 32,
  },
  featureChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
