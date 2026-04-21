import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../constants/mockData';
import { getSellerOrders, getMyProducts } from '../../services/api';
import OrderCard from '../../components/OrderCard';
import RoleSwitcherPill from '../../components/RoleSwitcherPill';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, sublabel, icon, gradient }) => (
  <LinearGradient colors={gradient} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
    <View style={styles.statCardTop}>
      <Ionicons name={icon} size={22} color="rgba(255,255,255,0.9)" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
  </LinearGradient>
);

export default function SellerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [allOrders, setAllOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    getSellerOrders()
      .then((res) => setAllOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllOrders([]))
      .finally(() => setLoadingOrders(false));

    getMyProducts()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const normalized = raw.map((p) => ({
          ...p,
          stock: p.stockCount ?? p.stock ?? 0,
          sold: p.totalSold ?? p.sold ?? 0,
          currency: p.currency || 'NGN',
          gradient: p.gradient || ['#4A0080', '#9B1DE8'],
        }));
        setTopProducts(normalized.slice(0, 3));
      })
      .catch(() => setTopProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  const recentOrders = allOrders.slice(0, 3);

  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + (o.price || 0) * (o.quantity || 1),
    0
  );
  const currency = allOrders[0]?.currency || 'NGN';

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  return (
    <View style={styles.container}>
    <ScrollView
      style={{ flex: 1, paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good afternoon 👋</Text>
          <Text style={styles.name}>{user?.name || 'Seller'}</Text>
        </View>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={[COLORS.gold, '#F5B84A']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Revenue"
          value={loadingOrders ? '—' : formatCurrency(totalRevenue, currency)}
          sublabel={loadingOrders ? '' : `${allOrders.length} orders total`}
          icon="cash-outline"
          gradient={['#1A6B3C', '#22A855']}
        />
        <StatCard
          label="Orders"
          value={loadingOrders ? '—' : String(allOrders.length)}
          sublabel={loadingOrders ? '' : 'All time'}
          icon="cube-outline"
          gradient={['#4A0080', '#9B1DE8']}
        />
        <StatCard
          label="Products"
          value={loadingProducts ? '—' : String(topProducts.length)}
          sublabel="In catalogue"
          icon="pricetag-outline"
          gradient={['#0D1B2A', '#1565C0']}
        />
        <StatCard
          label="Pending"
          value={loadingOrders ? '—' : String(
            allOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length
          )}
          sublabel="Need dispatch"
          icon="time-outline"
          gradient={['#7B3A00', '#E8A020']}
        />
      </View>

      {/* Go Live CTA */}
      <TouchableOpacity
        style={styles.goLiveBtn}
        onPress={() => navigation.navigate('Go Live')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.liveRed, '#FF6B6B']}
          style={styles.goLiveBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.goLiveDot} />
          <Text style={styles.goLiveBtnText}>Go Live Now</Text>
          <Ionicons name="radio" size={22} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Schedule stream */}
      <TouchableOpacity style={styles.scheduleBtn}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.gold} />
        <Text style={styles.scheduleBtnText}>Schedule a Stream</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Recent orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {loadingOrders ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 16 }} />
        ) : recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet</Text>
        ) : (
          <View style={styles.orderList}>
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} isSeller />
            ))}
          </View>
        )}
      </View>

      {/* Top products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>Manage →</Text>
          </TouchableOpacity>
        </View>
        {loadingProducts ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 16 }} />
        ) : topProducts.length === 0 ? (
          <Text style={styles.emptyText}>No products yet</Text>
        ) : (
          topProducts.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <LinearGradient
                colors={product.gradient || ['#4A0080', '#9B1DE8']}
                style={styles.productThumb}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 18 }}>🛍️</Text>
              </LinearGradient>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  {formatCurrency(product.price, product.currency)}
                </Text>
              </View>
              <View style={styles.productStats}>
                <Text style={styles.productSold}>{product.sold} sold</Text>
                <Text style={styles.productStock}>{product.stock} left</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
    {/* <RoleSwitcherPill /> */}
    </View>
  );
}

const CARD_WIDTH = (width - 52) / 2;

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.dark },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16 },
  greeting:         { color: COLORS.textMuted, fontSize: 13 },
  name:             { color: COLORS.white, fontSize: 22, fontWeight: '800', marginTop: 2 },
  avatarContainer:  { position: 'relative' },
  avatar:           { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { color: COLORS.dark, fontSize: 18, fontWeight: '800' },
  onlineDot:        { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green, borderWidth: 2, borderColor: COLORS.dark },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  statCard:         { width: CARD_WIDTH, borderRadius: 16, padding: 16, gap: 6 },
  statCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statValue:        { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  statLabel:        { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  statSublabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  goLiveBtn:        { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: COLORS.liveRed, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  goLiveBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  goLiveDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white },
  goLiveBtnText:    { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  scheduleBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 28 },
  scheduleBtnText:  { flex: 1, color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  section:          { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:     { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  seeAll:           { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
  orderList:        { gap: 12 },
  emptyText:        { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },
  productRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productThumb:     { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productInfo:      { flex: 1 },
  productName:      { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  productPrice:     { color: COLORS.gold, fontSize: 13, fontWeight: '700', marginTop: 2 },
  productStats:     { alignItems: 'flex-end' },
  productSold:      { color: COLORS.green, fontSize: 12, fontWeight: '600' },
  productStock:     { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
