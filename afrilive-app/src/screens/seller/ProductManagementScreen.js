import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../constants/mockData';
import { getMyProducts, updateProduct, deleteProduct } from '../../services/api';

const DEFAULT_GRADIENT = ['#4A0080', '#9B1DE8'];

// Map backend field names → frontend field names used by the UI
const normalize = (p) => ({
  ...p,
  available: p.isActive  ?? p.available  ?? true,
  stock:     p.stockCount ?? p.stock      ?? 0,
  sold:      p.totalSold  ?? p.sold       ?? 0,
  currency:  p.currency  || 'NGN',
  gradient:  p.gradient  || DEFAULT_GRADIENT,
});

export default function ProductManagementScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyProducts();
      setProducts((res.data || []).map(normalize));
    } catch (err) {
      setError('Could not load products. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever this screen gains focus (e.g. after adding/editing)
  useFocusEffect(
    useCallback(() => { fetchProducts(); }, [])
  );

  const toggleAvailability = async (id, current) => {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !current } : p))
    );
    try {
      await updateProduct(id, { isActive: !current });
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, available: current } : p))
      );
      Alert.alert('Error', 'Could not update product. Please try again.');
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete product',
      `Remove "${name}" from your catalogue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            try {
              await deleteProduct(id);
            } catch {
              Alert.alert('Error', 'Could not delete product. Please try again.');
              fetchProducts(); // restore state
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, !item.available && styles.productCardInactive]}
      onLongPress={() => handleDelete(item.id, item.name)}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={item.gradient}
        style={styles.productImage}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{ fontSize: 26 }}>🛍️</Text>
        {!item.available && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>OFF</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price, item.currency)}</Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockBadge, item.stock < 5 && styles.stockBadgeLow]}>
            <Text style={[styles.stockText, item.stock < 5 && styles.stockTextLow]}>
              {item.stock} in stock
            </Text>
          </View>
          <Text style={styles.soldText}>{item.sold} sold</Text>
        </View>
      </View>

      <View style={styles.productActions}>
        <Switch
          value={item.available}
          onValueChange={() => toggleAvailability(item.id, item.available)}
          trackColor={{ false: COLORS.border, true: COLORS.green }}
          thumbColor={COLORS.white}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddEditProduct', { product: item })}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSubtitle}>{products.length} products in catalogue</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditProduct', { product: null })}
        >
          <Ionicons name="add" size={22} color={COLORS.dark} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{products.filter((p) => p.available).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{products.reduce((s, p) => s + (p.sold || 0), 0)}</Text>
          <Text style={styles.statLabel}>Total Sold</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{products.filter((p) => p.stock < 5).length}</Text>
          <Text style={[styles.statLabel, { color: COLORS.red }]}>Low Stock</Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={renderProduct}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptySubtitle}>Add your first product to start selling</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddEditProduct', { product: null })}
              >
                <Text style={styles.emptyAddBtnText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.dark },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle:        { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  headerSubtitle:     { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  addBtn:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText:         { color: COLORS.dark, fontSize: 14, fontWeight: '800' },
  statsRow:           { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  statItem:           { flex: 1, alignItems: 'center' },
  statValue:          { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  statLabel:          { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statDivider:        { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  list:               { paddingHorizontal: 20, paddingBottom: 30 },
  productCard:        { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  productCardInactive:{ opacity: 0.6 },
  productImage:       { width: 76, height: 76, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  inactiveBadge:      { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 },
  inactiveBadgeText:  { color: COLORS.textMuted, fontSize: 9, fontWeight: '700' },
  productInfo:        { flex: 1 },
  productName:        { color: COLORS.white, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  productCategory:    { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  productPrice:       { color: COLORS.gold, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  stockRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge:         { backgroundColor: 'rgba(26,107,60,0.2)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  stockBadgeLow:      { backgroundColor: 'rgba(192,57,43,0.2)' },
  stockText:          { color: COLORS.green, fontSize: 11, fontWeight: '600' },
  stockTextLow:       { color: COLORS.red },
  soldText:           { color: COLORS.textMuted, fontSize: 11 },
  productActions:     { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  editBtn:            { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center' },
  centered:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText:          { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn:           { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:       { color: COLORS.dark, fontSize: 14, fontWeight: '800' },
  emptyState:         { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 16 },
  emptyTitle:         { color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle:      { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyAddBtn:        { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddBtnText:    { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
