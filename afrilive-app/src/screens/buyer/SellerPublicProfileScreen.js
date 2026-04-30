import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { DISCOVERY_MOCK_STREAMS, MOCK_PRODUCTS, formatCurrency } from '../../constants/mockData';

const FOLLOWING_KEY = '@afrilive_following';

export default function SellerPublicProfileScreen({ navigation, route }) {
  const { seller } = route.params || {};
  const insets = useSafeAreaInsets();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FOLLOWING_KEY).then(val => {
      const list = JSON.parse(val || '[]');
      setIsFollowing(list.includes(seller?.name));
    });
  }, [seller?.name]);

  const handleFollowToggle = async () => {
    const val = await AsyncStorage.getItem(FOLLOWING_KEY);
    const list = JSON.parse(val || '[]');
    const updated = isFollowing
      ? list.filter(n => n !== seller?.name)
      : [...list, seller?.name];
    await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };

  const sellerStreams = seller?.stream
    ? [seller.stream]
    : DISCOVERY_MOCK_STREAMS.filter(s => s.sellerName === seller?.name).slice(0, 3);

  const products = MOCK_PRODUCTS.filter(p => p.available).slice(0, 4);
  const initials = seller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  const handleWatchLive = () => {
    if (seller?.stream) {
      navigation.navigate('Discover', { screen: 'LiveStream', params: { stream: seller.stream } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {seller?.isLive && (
          <TouchableOpacity style={styles.liveBanner} onPress={handleWatchLive}>
            <View style={styles.liveBannerDot} />
            <Text style={styles.liveBannerText}>LIVE NOW</Text>
            <Text style={styles.liveBannerSub}>Tap to watch the stream</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
            {seller?.isLive && <View style={styles.avatarLiveDot} />}
          </View>
          <Text style={styles.sellerName}>{seller?.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.locationText}>{seller?.location}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Sales', value: '847' },
            { label: 'Rating', value: '4.8 ⭐' },
            { label: 'Streams', value: String(sellerStreams.length || 12) },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Streams</Text>
          {sellerStreams.map(stream => (
            <TouchableOpacity
              key={stream.id}
              style={styles.streamCard}
              onPress={() => navigation.navigate('Discover', { screen: 'LiveStream', params: { stream } })}
            >
              <View style={styles.streamThumb}>
                <Text style={{ fontSize: 22 }}>📡</Text>
              </View>
              <View style={styles.streamInfo}>
                <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
                <Text style={styles.streamMeta}>
                  {stream.category}
                  {stream.isLive
                    ? ` · ${(stream.viewerCount || 0).toLocaleString()} watching`
                    : ` · Starting ${stream.startTime || 'Soon'}`}
                </Text>
              </View>
              {stream.isLive
                ? <View style={styles.livePill}><Text style={styles.livePillText}>LIVE</Text></View>
                : <View style={styles.soonPill}><Text style={styles.soonPillText}>Soon</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productThumb}>
                <Text style={{ fontSize: 22 }}>🛍️</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(product.price, product.currency)}</Text>
              </View>
              <TouchableOpacity
                style={styles.buyNowBtn}
                onPress={() => Alert.alert('Buy Now', `Add ${product.name} to cart?`)}
              >
                <Text style={styles.buyNowText}>BUY NOW</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  scroll: { paddingBottom: 20 },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.liveRed, marginHorizontal: 16,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  liveBannerDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white,
  },
  liveBannerText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  liveBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  profileSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, shadowColor: COLORS.gold, shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  avatarText: { color: COLORS.dark, fontSize: 32, fontWeight: '800' },
  avatarLiveDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.liveRed, borderWidth: 3, borderColor: COLORS.dark,
  },
  sellerName: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  locationText: { color: COLORS.textMuted, fontSize: 13 },
  followBtn: {
    paddingHorizontal: 32, paddingVertical: 10,
    borderRadius: 24, borderWidth: 2, borderColor: COLORS.gold,
  },
  followingBtn: { backgroundColor: COLORS.gold },
  followBtnText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  followingBtnText: { color: COLORS.dark },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 20, backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 20, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    color: COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 12,
  },
  streamCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  streamThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  streamInfo: { flex: 1 },
  streamTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  streamMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  livePill: {
    backgroundColor: COLORS.liveRed, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  livePillText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  soonPill: {
    backgroundColor: COLORS.surface, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  soonPillText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  productCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  productThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  productPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  buyNowBtn: {
    backgroundColor: COLORS.gold, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  buyNowText: { color: COLORS.dark, fontSize: 11, fontWeight: '800' },
});
