import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { formatViewerCount, formatCurrency } from '../../constants/mockData';
import CheckoutBottomSheet from '../../components/CheckoutBottomSheet';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import ChatOverlay from '../../components/ChatOverlay';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../context/OrdersContext';

const { width, height } = Dimensions.get('window');

// Simulates signal-quality dots — static 4/5 bars for the live feed
const ConnectionQualityDots = ({ quality = 4 }) => {
  return (
    <View style={styles.qualityContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.qualityDot,
            { backgroundColor: i <= quality ? COLORS.green : COLORS.border },
          ]}
        />
      ))}
    </View>
  );
};

const HeartAnimation = () => {
  const [heartList, setHeartList] = useState([]);

  const spawnHeart = () => {
    const id = Date.now();
    const startX = Math.random() * 40 - 20;
    const anim = new Animated.Value(0);

    setHeartList((prev) => [...prev.slice(-8), { id, startX, anim }]);

    Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }).start(() => {
      setHeartList((prev) => prev.filter((h) => h.id !== id));
    });
  };

  return (
    <View style={styles.heartsContainer} pointerEvents="box-none">
      {heartList.map((h) => (
        <Animated.Text
          key={h.id}
          style={[
            styles.floatingHeart,
            {
              transform: [
                { translateX: h.startX },
                {
                  translateY: h.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -180],
                  }),
                },
              ],
              opacity: h.anim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1, 0.8, 0],
              }),
            },
          ]}
        >
          ❤️
        </Animated.Text>
      ))}
      <TouchableOpacity style={styles.heartBtn} onPress={spawnHeart}>
        <Ionicons name="heart" size={30} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// Animated gradient background that simulates a live feed with subtle color shifts
const AnimatedLiveBackground = ({ gradient }) => {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow color-shift loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shiftAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(shiftAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Subtle brightness pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Scan line sweeping down
    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base gradient */}
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />

      {/* Shifting overlay layer */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: shiftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.28] }),
          },
        ]}
      >
        <LinearGradient
          colors={[gradient[1] || '#000', gradient[0] || '#111', gradient[1] || '#000']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
      </Animated.View>

      {/* Bright pulse overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
            backgroundColor: '#fff',
          },
        ]}
      />

      {/* Diagonal shimmer sweep */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.18,
            transform: [
              {
                translateY: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-height, height],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
          style={{ height: 80, width: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

export default function LiveStreamScreen({ route, navigation }) {
  const { stream } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { addOrder } = useOrders();
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const handleOrderSuccess = (order) => {
    addOrder(order);
    setSuccessOrder(order);
  };

  useEffect(() => {
    // Fade in the background on mount
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Simulate live viewer count fluctuation
    if (stream.isLive) {
      const interval = setInterval(() => {
        setViewerCount((v) => Math.max(0, v + Math.floor(Math.random() * 10 - 3)));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, []);

  const renderBackground = () => {
    if (!stream.isLive) {
      return (
        <LinearGradient colors={stream.gradient} style={StyleSheet.absoluteFill}>
          <View style={styles.upcomingOverlay}>
            <Text style={styles.upcomingEmoji}>⏰</Text>
            <Text style={styles.upcomingTitle}>Stream starts at {stream.startTime}</Text>
            <Text style={styles.upcomingSubtitle}>Set a reminder to get notified</Text>
            <TouchableOpacity style={styles.reminderBtn}>
              <Ionicons name="notifications" size={16} color={COLORS.dark} />
              <Text style={styles.reminderBtnText}>Remind Me</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }

    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeIn }]}>
        <AnimatedLiveBackground gradient={stream.gradient} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Animated gradient background simulating live feed */}
      {renderBackground()}

      {/* Dark gradient overlay at bottom for text readability */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* TOP BAR */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topLeft}>
          {/* Seller info */}
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{stream.sellerName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.sellerName}>{stream.sellerName}</Text>
              <Text style={styles.sellerLocation}>
                <Ionicons name="location-outline" size={11} color={COLORS.textMuted} /> {stream.location}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRight}>
          {/* Connection quality */}
          <ConnectionQualityDots quality={4} />
          {/* Viewer count */}
          <View style={styles.viewerCount}>
            <View style={styles.liveDot} />
            <Text style={styles.viewerCountText}>
              {stream.isLive ? `${formatViewerCount(viewerCount)} watching` : 'Upcoming'}
            </Text>
          </View>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* RIGHT SIDE ACTIONS */}
      <View style={styles.rightActions}>
        <HeartAnimation />
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={26} color={COLORS.white} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="cart-outline" size={26} color={COLORS.white} />
          <Text style={styles.actionLabel}>Cart</Text>
        </TouchableOpacity>
      </View>

      {/* LEFT SIDE - CHAT */}
      <View style={styles.chatContainer}>
        <ChatOverlay userName={user?.name} />
      </View>

      {/* BOTTOM - PINNED PRODUCT */}
      {stream.pinnedProduct && (
        <View style={styles.pinnedProductBar}>
          <LinearGradient
            colors={stream.pinnedProduct.gradient || stream.gradient}
            style={styles.pinnedProductThumb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 22 }}>🛍️</Text>
          </LinearGradient>
          <View style={styles.pinnedProductInfo}>
            <Text style={styles.pinnedProductName} numberOfLines={1}>
              {stream.pinnedProduct.name}
            </Text>
            <Text style={styles.pinnedProductPrice}>
              {formatCurrency(stream.pinnedProduct.price, stream.pinnedProduct.currency || 'NGN')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.buyNowBtn}
            onPress={() => setCheckoutVisible(true)}
            disabled={!stream.isLive}
          >
            <Text style={styles.buyNowText}>
              {stream.isLive ? 'BUY NOW' : 'UPCOMING'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CHECKOUT BOTTOM SHEET */}
      <CheckoutBottomSheet
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        product={stream.pinnedProduct}
        stream={stream}
        onSuccess={handleOrderSuccess}
      />

      {/* ORDER SUCCESS FULL-SCREEN */}
      <OrderSuccessModal
        visible={!!successOrder}
        order={successOrder}
        onTrackOrder={() => {
          setSuccessOrder(null);
          navigation.getParent()?.navigate('Orders');
        }}
        onContinueShopping={() => {
          setSuccessOrder(null);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  topLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    paddingRight: 12,
    paddingVertical: 4,
    paddingLeft: 4,
  },
  sellerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  sellerAvatarText: { color: COLORS.dark, fontSize: 14, fontWeight: '800' },
  sellerName: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  sellerLocation: { color: COLORS.textMuted, fontSize: 11 },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.white,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  followBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  followBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  followBtnTextActive: { color: COLORS.dark },
  topRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  qualityContainer: { flexDirection: 'row', gap: 3 },
  qualityDot: { width: 5, height: 10, borderRadius: 3 },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.liveRed,
  },
  viewerCountText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 180,
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  heartsContainer: { alignItems: 'center' },
  heartBtn: { alignItems: 'center' },
  floatingHeart: {
    position: 'absolute',
    fontSize: 24,
    bottom: 0,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: COLORS.white, fontSize: 11, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  chatContainer: {
    position: 'absolute',
    left: 12,
    bottom: 100,
    width: width * 0.68,
    zIndex: 10,
  },
  pinnedProductBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14,14,14,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    zIndex: 10,
  },
  pinnedProductThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedProductInfo: { flex: 1 },
  pinnedProductName: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  pinnedProductPrice: { color: COLORS.gold, fontSize: 16, fontWeight: '800' },
  buyNowBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyNowText: { color: COLORS.dark, fontSize: 13, fontWeight: '800' },
  upcomingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  upcomingEmoji: { fontSize: 56, marginBottom: 16 },
  upcomingTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  upcomingSubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  reminderBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '700' },
});
