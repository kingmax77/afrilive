import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { DISCOVERY_MOCK_STREAMS, MOCK_PRODUCTS, formatCurrency, formatViewerCount } from '../../constants/mockData';

const CATEGORIES = [
  { label: 'Fashion', emoji: '👗' },
  { label: 'Electronics', emoji: '📱' },
  { label: 'Food', emoji: '🍎' },
  { label: 'Beauty', emoji: '💄' },
  { label: 'Shoes', emoji: '👟' },
  { label: 'Home', emoji: '🏠' },
  { label: 'Health', emoji: '💊' },
  { label: 'Gaming', emoji: '🎮' },
];

const TRENDING_PRODUCTS = DISCOVERY_MOCK_STREAMS
  .filter(s => s.pinnedProduct)
  .map(s => ({
    id: s.id + '_p',
    name: s.pinnedProduct.name,
    price: s.pinnedProduct.price,
    currency: s.pinnedProduct.currency,
    sellerName: s.sellerName,
    location: s.location,
    category: s.category,
    isLive: s.isLive,
    gradient: s.pinnedProduct.gradient || s.gradient,
    stream: s,
  }));

const POPULAR_SELLERS = DISCOVERY_MOCK_STREAMS.map(s => ({
  id: s.id + '_seller',
  name: s.sellerName,
  location: s.location,
  isLive: s.isLive,
  stream: s,
}));

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function LiveBadge({ small }) {
  return (
    <View style={[styles.liveBadge, small && styles.liveBadgeSmall]}>
      <View style={styles.liveBadgeDot} />
      <Text style={[styles.liveBadgeText, small && styles.liveBadgeTextSmall]}>LIVE</Text>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const inputRef = useRef(null);
  const resultsOpacity = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = useState('');
  const [isFocusedInput, setIsFocusedInput] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 500);

  useEffect(() => {
    if (isFocused) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isFocused]);

  useEffect(() => {
    if (debouncedQuery) {
      Animated.timing(resultsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      resultsOpacity.setValue(0);
    }
  }, [debouncedQuery]);

  const searchResults = useCallback(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return { products: [], sellers: [], streams: [] };

    const products = MOCK_PRODUCTS.filter(
      p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );

    const sellers = [...new Map(
      DISCOVERY_MOCK_STREAMS
        .filter(s => s.sellerName.toLowerCase().includes(q) || s.location.toLowerCase().includes(q))
        .map(s => [s.sellerName, { id: s.id, name: s.sellerName, location: s.location, isLive: s.isLive, stream: s }])
    ).values()];

    const streams = DISCOVERY_MOCK_STREAMS.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.sellerName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
    );

    return { products, sellers, streams };
  }, [debouncedQuery]);

  const results = searchResults();
  const hasResults = results.products.length + results.sellers.length + results.streams.length > 0;
  const isSearching = !!debouncedQuery;

  const handleCategoryTap = (category) => {
    navigation.navigate('Discover', { screen: 'DiscoveryFeed', params: { initialCategory: category } });
  };

  const handleTrendingProductTap = (item) => {
    if (item.isLive && item.stream) {
      navigation.navigate('Discover', { screen: 'LiveStream', params: { stream: item.stream } });
    } else {
      navigation.navigate('StreamNotStarted', { stream: item.stream, product: item });
    }
  };

  const handleSellerTap = (seller) => {
    navigation.navigate('SellerPublicProfile', { seller });
  };

  const handleWatchLive = (seller) => {
    if (seller.stream) {
      navigation.navigate('Discover', { screen: 'LiveStream', params: { stream: seller.stream } });
    }
  };

  const handleProductResultTap = (product) => {
    const stream = DISCOVERY_MOCK_STREAMS.find(s => s.sellerName && product.category === s.category);
    if (stream) {
      if (stream.isLive) {
        navigation.navigate('Discover', { screen: 'LiveStream', params: { stream } });
      } else {
        navigation.navigate('StreamNotStarted', { stream, product });
      }
    }
  };

  const renderDefaultState = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.defaultScroll}>
      {/* Trending Now */}
      <SectionHeader title="Trending Now 🔥" />
      {TRENDING_PRODUCTS.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.trendingCard}
          onPress={() => handleTrendingProductTap(item)}
          activeOpacity={0.75}
        >
          <View style={styles.trendingThumb}>
            <Text style={{ fontSize: 22 }}>🛍️</Text>
          </View>
          <View style={styles.trendingInfo}>
            <View style={styles.trendingTopRow}>
              <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
              {item.isLive && <LiveBadge small />}
            </View>
            <Text style={styles.trendingPrice}>{formatCurrency(item.price, item.currency)}</Text>
            <Text style={styles.trendingSeller}>{item.sellerName} · {item.location}</Text>
            <View style={styles.categoryTagSmall}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      ))}

      {/* Browse Categories */}
      <SectionHeader title="Browse Categories" />
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.label}
            style={styles.categoryCard}
            onPress={() => handleCategoryTap(cat.label)}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular Sellers */}
      <SectionHeader title="Popular Sellers" />
      {POPULAR_SELLERS.map(seller => (
        <TouchableOpacity
          key={seller.id}
          style={styles.sellerCard}
          onPress={() => handleSellerTap(seller)}
          activeOpacity={0.75}
        >
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>{seller.name.charAt(0)}</Text>
            {seller.isLive && <View style={styles.sellerLiveDot} />}
          </View>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{seller.name}</Text>
              {seller.isLive && <LiveBadge small />}
            </View>
            <Text style={styles.sellerLocation}>{seller.location}</Text>
          </View>
          {seller.isLive ? (
            <TouchableOpacity
              style={styles.watchLiveBtn}
              onPress={() => handleWatchLive(seller)}
            >
              <Text style={styles.watchLiveBtnText}>Watch Live</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => handleSellerTap(seller)}
            >
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderResults = () => {
    if (!hasResults) {
      return (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyResultsTitle}>No results for "{debouncedQuery}"</Text>
          <Text style={styles.emptyResultsSubtitle}>
            Try searching for Fashion, Lagos, or a seller name
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.defaultScroll}>
        {/* Products */}
        {results.products.length > 0 && (
          <>
            <SectionHeader title="Products" />
            {results.products.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultProductCard}
                onPress={() => handleProductResultTap(item)}
                activeOpacity={0.75}
              >
                <View style={styles.resultProductThumb}>
                  <Text style={{ fontSize: 20 }}>🛍️</Text>
                </View>
                <View style={styles.resultProductInfo}>
                  <Text style={styles.resultProductName}>{item.name}</Text>
                  <Text style={styles.resultProductSeller}>{item.category}</Text>
                  <Text style={styles.resultProductPrice}>{formatCurrency(item.price, item.currency)}</Text>
                </View>
                <TouchableOpacity style={styles.buyNowBtn} onPress={() => handleProductResultTap(item)}>
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Sellers */}
        {results.sellers.length > 0 && (
          <>
            <SectionHeader title="Sellers" />
            {results.sellers.map(seller => (
              <TouchableOpacity
                key={seller.id}
                style={styles.sellerCard}
                onPress={() => handleSellerTap(seller)}
                activeOpacity={0.75}
              >
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>{seller.name.charAt(0)}</Text>
                  {seller.isLive && <View style={styles.sellerLiveDot} />}
                </View>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{seller.name}</Text>
                    {seller.isLive && <LiveBadge small />}
                  </View>
                  <Text style={styles.sellerLocation}>{seller.location}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.followBtn, seller.isLive && styles.watchLiveBtn]}
                  onPress={() => seller.isLive ? handleWatchLive(seller) : handleSellerTap(seller)}
                >
                  <Text style={[styles.followBtnText, seller.isLive && styles.watchLiveBtnText]}>
                    {seller.isLive ? 'Watch Live' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Streams */}
        {results.streams.length > 0 && (
          <>
            <SectionHeader title="Streams" />
            {results.streams.map(stream => (
              <TouchableOpacity
                key={stream.id}
                style={styles.streamResultCard}
                onPress={() => {
                  if (stream.isLive) {
                    navigation.navigate('Discover', { screen: 'LiveStream', params: { stream } });
                  } else {
                    navigation.navigate('StreamNotStarted', { stream });
                  }
                }}
              >
                <View style={styles.streamResultThumb}>
                  <Text style={{ fontSize: 20 }}>📡</Text>
                </View>
                <View style={styles.streamResultInfo}>
                  <Text style={styles.streamResultTitle} numberOfLines={1}>{stream.title}</Text>
                  <Text style={styles.streamResultSeller}>{stream.sellerName}</Text>
                  {stream.isLive && (
                    <Text style={styles.streamViewers}>
                      👁 {formatViewerCount(stream.viewerCount)} watching
                    </Text>
                  )}
                </View>
                {stream.isLive ? <LiveBadge /> : (
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingText}>Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Search bar */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, isFocusedInput && styles.searchBarFocused]}>
            <Ionicons name="search" size={20} color={isFocusedInput ? COLORS.gold : COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search products, sellers, categories..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocusedInput(true)}
              onBlur={() => setIsFocusedInput(false)}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching ? (
          <Animated.View style={[{ flex: 1 }, { opacity: resultsOpacity }]}>
            {renderResults()}
          </Animated.View>
        ) : (
          renderDefaultState()
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  searchBarContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchBarFocused: { borderColor: COLORS.gold },
  searchIcon: {},
  searchInput: { flex: 1, color: COLORS.white, fontSize: 15 },
  defaultScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginTop: 20, marginBottom: 12 },
  // Trending
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendingThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingInfo: { flex: 1 },
  trendingTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  trendingName: { color: COLORS.white, fontSize: 14, fontWeight: '700', flex: 1 },
  trendingPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800' },
  trendingSeller: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  categoryTagSmall: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,160,32,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  categoryTagText: { color: COLORS.gold, fontSize: 10, fontWeight: '700' },
  // Categories grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  // Sellers
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: { color: COLORS.dark, fontSize: 18, fontWeight: '800' },
  sellerLiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.liveRed,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  sellerInfo: { flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerName: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  sellerLocation: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  followBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  watchLiveBtn: { backgroundColor: COLORS.liveRed, borderColor: COLORS.liveRed, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  watchLiveBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveRed,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  liveBadgeSmall: { paddingHorizontal: 5, paddingVertical: 2 },
  liveBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.white },
  liveBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  liveBadgeTextSmall: { fontSize: 9 },
  // Results
  resultProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultProductThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultProductInfo: { flex: 1 },
  resultProductName: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  resultProductSeller: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  resultProductPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  buyNowBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  buyNowText: { color: COLORS.dark, fontSize: 12, fontWeight: '800' },
  streamResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streamResultThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamResultInfo: { flex: 1 },
  streamResultTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  streamResultSeller: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  streamViewers: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  upcomingBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upcomingText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  // Empty results
  emptyResults: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyResultsTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyResultsSubtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
