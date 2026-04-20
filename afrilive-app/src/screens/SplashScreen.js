import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { user, loading } = useAuth();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      if (!loading) {
        // RootNavigator handles auth → app transition automatically.
        // Splash only needs to move forward when no user is logged in.
        if (!user) {
          navigation.replace('Phone');
        }
        // If user exists, RootNavigator is already showing BuyerApp/SellerApp
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [loading, user]);

  return (
    <LinearGradient colors={['#0A0A0A', '#141414', '#0A0A0A']} style={styles.container}>
      {/* Background glow */}
      <Animated.View
        style={[styles.glow, { transform: [{ scale: pulseScale }] }]}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>📡</Text>
        </View>

        <Text style={styles.logoText}>
          <Text style={styles.logoAfri}>Afri</Text>
          <Text style={styles.logoLive}>Live</Text>
        </Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Shop live. Buy local. Delivered.
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <Text style={styles.footerText}>🌍 Made for Africa</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.gold,
    opacity: 0.06,
    top: height / 2 - 150,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 38,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoAfri: {
    color: COLORS.white,
  },
  logoLive: {
    color: COLORS.gold,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
