import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { formatViewerCount, formatCurrency, DISCOVERY_MOCK_STREAMS } from '../../constants/mockData';
import { getLiveStreams } from '../../services/api';
import RoleSwitcherPill from '../../components/RoleSwitcherPill';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height;

const CATEGORIES = ['All', 'Fashion', 'Electronics', 'Food', 'Beauty', 'Shoes'];
const REFRESH_INTERVAL = 30000;

const normalizeApiStream = (s) => ({
  id: s.id,
  title: s.title,
  category: s.category || 'Other',
  sellerName: s.seller?.name || 'Seller',
  location: s.seller?.addresses?.[0]?.landmark || null,
  isLive: s.status === 'LIVE',
  isReal: true,
  viewerCount: s.viewerCount || 0,
  startTime: s.scheduledFor
    ? new Date(s.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Soon',
  gradient: ['#0D1B2A', '#1A3A5C'],
  pinnedProduct: s.pinnedProduct
    ? {
        id: s.pinnedProduct.id,
        name: s.pinnedProduct.name,
        price: s.pinnedProduct.price,
        currency: s.pinnedProduct.currency,
        gradient: ['#1A1A2E', '#2A2A4E'],
      }
    : null,
});

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

const StreamCard = ({ stream, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={[styles.card, stream.isReal && styles.cardReal]}
    >
      <LinearGradient
        colors={stream.gradient || ['#1a1a2e', '#16213e']}
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
        {stream.isLive ? <LiveBadge /> : (
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingText}>⏰ Starting {stream.startTime}</Text>
          </View>
        )}
        {stream.isLive && (
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>
              👁 {formatViewerCount(stream.viewerCount || 0)} watching
            </Text>
          </View>
        )}
      </View>

      {/* Right side actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart" size={28} color={COLORS.white} />
          <Text style={styles.actionCount}>
            {formatViewerCount(Math.floor((stream.viewerCount || 0) * 0.3))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>
              {(stream.sellerName || '?').charAt(0)}
            </Text>
            {stream.isLive && <View style={styles.sellerLiveDot} />}
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
              colors={stream.pinnedProduct.gradient || stream.gradient || ['#333', '#555']}
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
            <TouchableOpacity style={styles.buyNowBtn} onPress={onPress}>
              <Text style={styles.buyNowText}>BUY NOW</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function DiscoveryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(route?.params?.initialCategory || 'All');

  useEffect(() => {
    if (route?.params?.initialCategory) {
      setActiveFilter(route.params.initialCategory);
    }
  }, [route?.params?.initialCategory]);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'live'
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const livePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchStreams = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getLiveStreams();
      const apiStreams = (res.data || []).map(normalizeApiStream);
      console.log('[Discovery] API streams:', apiStreams.length, JSON.stringify(apiStreams.map((s) => ({ id: s.id, title: s.title, status: s.isLive ? 'LIVE' : 'SCHEDULED' }))));
      const apiIds = new Set(apiStreams.map((s) => s.id));
      const dedupedMocks = DISCOVERY_MOCK_STREAMS.filter((s) => !apiIds.has(s.id));
      setStreams([...apiStreams, ...dedupedMocks]);
    } catch (err) {
      console.error('[Discovery] getLiveStreams error:', err.response?.status, err.message);
      setStreams([...DISCOVERY_MOCK_STREAMS]);
      setError(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStreams(true);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    fetchStreams();
    refreshTimerRef.current = setInterval(() => fetchStreams(true), REFRESH_INTERVAL);
    return () => clearInterval(refreshTimerRef.current);
  }, []));

  const hasRealLive = streams.some((s) => s.isReal && s.isLive);

  const categoryFiltered = activeFilter === 'All'
    ? streams
    : streams.filter(s => s.category === activeFilter);

  const filteredStreams = viewMode === 'live'
    ? categoryFiltered.filter(s => s.isLive)
    : categoryFiltered;

  const handleStreamPress = (stream) => {
    navigation.navigate('LiveStream', { stream });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Loading streams...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Ionicons name="wifi-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorTitle}>Connection error</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchStreams}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top controls: pill switcher + category filters */}
      <View style={[styles.filterContainer, { paddingTop: insets.top + 8 }]}>
        {hasRealLive && (
          <View style={styles.realLiveRow}>
            <Animated.View style={[styles.realLiveDot, { transform: [{ scale: livePulse }] }]} />
            <Text style={styles.realLiveText}>🔴 Live streams active</Text>
          </View>
        )}
        {/* Pill switcher */}
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[styles.pill, viewMode === 'all' && styles.pillActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.pillText, viewMode === 'all' && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, viewMode === 'live' && styles.pillActive]}
            onPress={() => setViewMode('live')}
          >
            <View style={styles.pillLiveRow}>
              {viewMode === 'live' && <View style={styles.pillLiveDot} />}
              <Text style={[styles.pillText, viewMode === 'live' && styles.pillTextActive]}>
                Live Now
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Category filter chips */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item)}
              style={[styles.filterTab, activeFilter === item && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, activeFilter === item && styles.filterTabTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {filteredStreams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={styles.emptyTitle}>
            {viewMode === 'live' ? 'No one is live right now' : 'No streams right now'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {viewMode === 'live'
              ? 'No one is live right now. Check back soon! 📡'
              : 'Check back soon or follow sellers\nto get notified'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredStreams}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
        />
      )}
     {/* <RoleSwitcherPill /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
  errorTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  errorSubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 8,
    gap: 8,
  },
  realLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  realLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C0392B',
  },
  realLiveText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  pillRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 22,
  },
  pillActive: { backgroundColor: COLORS.gold },
  pillLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.liveRed },
  pillText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: COLORS.dark },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  filterTabActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  filterTabText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  filterTabTextActive: { color: COLORS.dark },
  card: {
    width,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  cardReal: {
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
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
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  liveBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  upcomingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upcomingText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
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
  bottomContent: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
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
    backgroundColor: COLORS.dark,
    paddingTop: 100,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
