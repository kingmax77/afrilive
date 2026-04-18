import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { MOCK_STREAMS, formatViewerCount, formatCurrency } from '../../constants/mockData';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height;

const LIVE_STREAMS = MOCK_STREAMS.filter((s) => s.isLive);

const LiveBadge = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveBadgeRow}>
      <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
};

const StreamCard = ({ stream, onPress }) => (
  <TouchableOpacity activeOpacity={1} onPress={onPress} style={styles.card}>
    <LinearGradient
      colors={stream.gradient}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.1)', 'transparent']}
      style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      start={{ x: 0, y: 0.3 }}
      end={{ x: 1, y: 0.7 }}
    />
    <LinearGradient
      colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
      style={StyleSheet.absoluteFill}
    />

    {/* Top row */}
    <View style={styles.topRow}>
      <LiveBadge />
      <View style={styles.viewerBadge}>
        <Text style={styles.viewerText}>
          👁 {formatViewerCount(stream.viewerCount)} watching
        </Text>
      </View>
    </View>

    {/* Right side actions */}
    <View style={styles.rightActions}>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="heart" size={28} color={COLORS.white} />
        <Text style={styles.actionCount}>
          {formatViewerCount(Math.floor(stream.viewerCount * 0.3))}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="share-social" size={26} color={COLORS.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <View style={styles.sellerAvatar}>
          <Text style={styles.sellerAvatarText}>{stream.sellerName.charAt(0)}</Text>
          <View style={styles.sellerLiveDot} />
        </View>
      </TouchableOpacity>
    </View>

    {/* Bottom content */}
    <View style={styles.bottomContent}>
      <View style={styles.sellerRow}>
        <Text style={styles.sellerName}>{stream.sellerName}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />{' '}
          {stream.location}
        </Text>
      </View>
      <Text style={styles.streamTitle} numberOfLines={2}>
        {stream.title}
      </Text>
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{stream.category}</Text>
      </View>
      {stream.pinnedProduct && (
        <TouchableOpacity style={styles.pinnedProduct} onPress={onPress}>
          <LinearGradient
            colors={stream.pinnedProduct.gradient || stream.gradient}
            style={styles.productThumb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.productThumbEmoji}>🛍️</Text>
          </LinearGradient>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {stream.pinnedProduct.name}
            </Text>
            <Text style={styles.productPrice}>
              {formatCurrency(stream.pinnedProduct.price, stream.pinnedProduct.currency)}
            </Text>
          </View>
          <View style={styles.buyNowBtn}>
            <Text style={styles.buyNowText}>BUY NOW</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

export default function LiveBrowserScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleStreamPress = (stream) => {
    navigation.navigate('LiveStream', { stream });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.liveNowRow}>
          <View style={styles.liveNowDot} />
          <Text style={styles.headerTitle}>Live Now</Text>
        </View>
        <Text style={styles.headerSub}>{LIVE_STREAMS.length} streams live</Text>
      </View>

      {LIVE_STREAMS.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={styles.emptyTitle}>No live streams right now</Text>
          <Text style={styles.emptySubtitle}>Check back soon — sellers go live throughout the day</Text>
        </View>
      ) : (
        <FlatList
          data={LIVE_STREAMS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StreamCard stream={item} onPress={() => handleStreamPress(item)} />
          )}
          pagingEnabled
          snapToInterval={CARD_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  liveNowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveNowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.liveRed },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  card: { width, height: CARD_HEIGHT, overflow: 'hidden' },
  topRow: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.white },
  liveBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewerText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 260,
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  sellerAvatarText: { color: COLORS.dark, fontSize: 20, fontWeight: '800' },
  sellerLiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.liveRed,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomContent: { position: 'absolute', bottom: 80, left: 16, right: 80 },
  sellerRow: { marginBottom: 6 },
  sellerName: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  location: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  streamTitle: { color: COLORS.white, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,160,32,0.2)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  categoryText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  pinnedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumbEmoji: { fontSize: 22 },
  productInfo: { flex: 1 },
  productName: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  productPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  buyNowBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buyNowText: { color: COLORS.dark, fontSize: 12, fontWeight: '800' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
