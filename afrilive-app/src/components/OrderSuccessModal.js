import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../constants/mockData';

const { width } = Dimensions.get('window');

export default function OrderSuccessModal({ visible, order, onTrackOrder, onContinueShopping }) {
  const insets = useSafeAreaInsets();

  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0)).current;
  const contentY    = useRef(new Animated.Value(30)).current;
  const contentOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && order) {
      // Reset
      bgOpacity.setValue(0);
      circleScale.setValue(0);
      checkScale.setValue(0);
      contentY.setValue(30);
      contentOp.setValue(0);

      Animated.sequence([
        Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(circleScale, { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(contentOp, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(contentY, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible, order]);

  if (!order) return null;

  const totalPaid = order.price * (order.quantity || 1) + 1500;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0A0A0A', '#0D1A0D']}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          {/* Animated checkmark circle */}
          <View style={styles.checkmarkWrapper}>
            <Animated.View style={[styles.outerRing, { transform: [{ scale: circleScale }] }]} />
            <Animated.View style={[styles.innerCircle, { transform: [{ scale: circleScale }] }]}>
              <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                <Ionicons name="checkmark" size={52} color={COLORS.white} />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Heading */}
          <Animated.View style={[styles.textBlock, { opacity: contentOp, transform: [{ translateY: contentY }] }]}>
            <Text style={styles.title}>Order Confirmed!</Text>
            <Text style={styles.subtitle}>
              Your payment was received and your order is being prepared.
            </Text>
          </Animated.View>

          {/* Order card */}
          <Animated.View style={[styles.orderCard, { opacity: contentOp, transform: [{ translateY: contentY }] }]}>
            {/* Product row */}
            <View style={styles.productRow}>
              <LinearGradient
                colors={order.productGradient || ['#333', '#555']}
                style={styles.productThumb}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 24 }}>🛍️</Text>
              </LinearGradient>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{order.productName}</Text>
                <Text style={styles.sellerName}>from {order.sellerName}</Text>
              </View>
              <Text style={styles.pricePaid}>
                {formatCurrency(totalPaid, order.currency || 'NGN')}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Details */}
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.gold} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Delivery Address</Text>
                <Text style={styles.detailValue}>{order.smartAddressCode}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.gold} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Estimated Delivery</Text>
                <Text style={styles.detailValue}>{order.estimatedDelivery || '2–4 hours'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="bicycle-outline" size={16} color={COLORS.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Rider</Text>
                <Text style={[styles.detailValue, { color: COLORS.textMuted }]}>
                  Assigning a rider... (~2 min)
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Status badge */}
            <View style={styles.statusRow}>
              <View style={styles.confirmedBadge}>
                <View style={styles.confirmedDot} />
                <Text style={styles.confirmedText}>Confirmed</Text>
              </View>
              <Text style={styles.orderedAt}>Just now</Text>
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttons, { opacity: contentOp, transform: [{ translateY: contentY }] }]}>
            <TouchableOpacity style={styles.trackBtn} onPress={onTrackOrder}>
              <Ionicons name="navigate-outline" size={18} color={COLORS.dark} />
              <Text style={styles.trackBtnText}>Track Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueBtn} onPress={onContinueShopping}>
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkmarkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 28,
    width: 120,
    height: 120,
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(26,107,60,0.4)',
    backgroundColor: 'rgba(26,107,60,0.1)',
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  orderCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productInfo: { flex: 1 },
  productName: { color: COLORS.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  sellerName: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  pricePaid: { color: COLORS.gold, fontSize: 16, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  detailContent: { flex: 1 },
  detailLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232,160,32,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,160,32,0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.gold },
  confirmedText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  orderedAt: { color: COLORS.textMuted, fontSize: 12 },
  buttons: {
    width: '100%',
    gap: 12,
  },
  trackBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  trackBtnText: { color: COLORS.dark, fontSize: 16, fontWeight: '800' },
  continueBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '700' },
});
