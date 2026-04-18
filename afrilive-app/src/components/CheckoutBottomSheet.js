import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../constants/mockData';
import { createOrder } from '../services/api';

const { height } = Dimensions.get('window');

const PAYMENT_METHODS = [
  { id: 'mpesa',  label: 'M-Pesa',       emoji: '💚', color: '#00A651', hint: 'STK Push to your phone' },
  { id: 'airtel', label: 'Airtel Money',  emoji: '❤️', color: '#E20613', hint: 'Airtel mobile money' },
  { id: 'mtn',    label: 'MTN MoMo',     emoji: '💛', color: '#FFC107', hint: 'MTN Mobile Money' },
  { id: 'card',   label: 'Card',         emoji: '💳', color: '#0052CC', hint: 'Visa / Mastercard' },
];

const DELIVERY_FEE = 1500;

export default function CheckoutBottomSheet({ visible, onClose, product, stream, onSuccess }) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [quantity, setQuantity] = useState(1);
  const [smartAddress, setSmartAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('mpesa');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSmartAddress('');
      setSelectedPayment('mpesa');
      setLoading(false);

      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const total = product ? product.price * quantity + DELIVERY_FEE : 0;

  const isUUID = (val) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const handleConfirmPay = async () => {
    if (!smartAddress.trim() || smartAddress.trim().length < 5) {
      Alert.alert('SmartAddress required', 'Enter your SmartAddress code to continue (e.g. BXR-204-17).');
      return;
    }

    setLoading(true);
    try {
      const res = await createOrder({
        ...(isUUID(product?.id)  ? { productId: product.id }  : {}),
        ...(isUUID(stream?.id)   ? { streamId:  stream.id }   : {}),
        quantity,
        smartAddressCode: smartAddress.trim().toUpperCase(),
        currency:         product.currency || 'NGN',
        paymentMethod:    selectedPayment,
      });

      const order = {
        id:               res.data?.id || `order_${Date.now()}`,
        productId:        product.id,
        productName:      product.name,
        productGradient:  product.gradient || ['#333', '#555'],
        sellerName:       stream?.sellerName || res.data?.sellerName || 'AfriLive Seller',
        sellerLocation:   stream?.location || null,
        price:            product.price,
        currency:         product.currency || 'NGN',
        quantity,
        total,
        smartAddressCode: smartAddress.trim().toUpperCase(),
        paymentMethod:    selectedPayment,
        status:           res.data?.status || 'confirmed',
        riderName:        res.data?.riderName || null,
        riderPhone:       res.data?.riderPhone || null,
        orderedAt:        'Just now',
        estimatedDelivery: res.data?.estimatedDelivery || '45 mins',
      };

      onSuccess?.(order);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not place order. Please try again.';
      Alert.alert('Order failed', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Product header */}
          <View style={styles.productHeader}>
            <LinearGradient
              colors={product.gradient || ['#333', '#555']}
              style={styles.productImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={{ fontSize: 30 }}>🛍️</Text>
            </LinearGradient>
            <View style={styles.productMeta}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                {formatCurrency(product.price, product.currency || 'NGN')}
              </Text>
              <Text style={styles.stockText}>
                {product.stock > 5 ? `${product.stock} in stock` : `⚠️ Only ${product.stock} left!`}
              </Text>
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* SmartAddress */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Delivery Address</Text>
            <View style={styles.smartAddressBox}>
              <View style={styles.inputRow}>
                <Ionicons name="location" size={20} color={COLORS.gold} />
                <TextInput
                  style={styles.smartInput}
                  placeholder="Enter your SmartAddress code (e.g. BXR-204-17)"
                  placeholderTextColor={COLORS.textMuted}
                  value={smartAddress}
                  onChangeText={(t) => setSmartAddress(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            {!smartAddress && (
              <TouchableOpacity style={styles.getSmartAddressRow}>
                <Ionicons name="map-outline" size={14} color={COLORS.gold} />
                <Text style={styles.getSmartAddressText}>
                  Get your SmartAddress code →
                </Text>
              </TouchableOpacity>
            )}
            {smartAddress.length >= 5 && (
              <View style={styles.addressVerified}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                <Text style={styles.addressVerifiedText}>Address verified</Text>
              </View>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    selectedPayment === method.id && {
                      borderColor: method.color,
                      backgroundColor: `${method.color}15`,
                    },
                  ]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Text style={styles.paymentEmoji}>{method.emoji}</Text>
                  <Text style={styles.paymentLabel}>{method.label}</Text>
                  {selectedPayment === method.id && (
                    <Ionicons name="checkmark-circle" size={14} color={method.color} style={styles.paymentCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.paymentHint}>
              {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.hint}
            </Text>
          </View>

          {/* Order summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(product.price * quantity, product.currency || 'NGN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Delivery fee</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(DELIVERY_FEE, product.currency || 'NGN')}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalKey}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(total, product.currency || 'NGN')}
              </Text>
            </View>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.confirmBtnLoading]}
            onPress={handleConfirmPay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.dark} />
            ) : (
              <Text style={styles.confirmBtnText}>
                Confirm & Pay {formatCurrency(total, product.currency || 'NGN')}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.secureText}>🔒 Secured by AfriLive Payments</Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.88,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  productHeader: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMeta: { flex: 1, justifyContent: 'center' },
  productName: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  productPrice: { color: COLORS.gold, fontSize: 20, fontWeight: '800' },
  stockText: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  section: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { color: COLORS.white, fontSize: 20, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  smartAddressBox: {
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smartInput: { flex: 1, color: COLORS.white, fontSize: 15, height: 48 },
  getSmartAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  getSmartAddressText: { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
  addressVerified: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  addressVerifiedText: { color: COLORS.green, fontSize: 13, fontWeight: '600' },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  paymentOption: {
    width: '47%',
    backgroundColor: COLORS.dark,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  paymentEmoji: { fontSize: 20 },
  paymentLabel: { color: COLORS.white, fontSize: 13, fontWeight: '600', flex: 1 },
  paymentCheck: { position: 'absolute', top: 6, right: 6 },
  paymentHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryKey: { color: COLORS.textMuted, fontSize: 14 },
  summaryValue: { color: COLORS.textSecondary, fontSize: 14 },
  summaryTotal: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  summaryTotalKey: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { color: COLORS.gold, fontSize: 18, fontWeight: '800' },
  confirmBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  confirmBtnLoading: { opacity: 0.8 },
  confirmBtnText: { color: COLORS.dark, fontSize: 17, fontWeight: '800' },
  secureText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
