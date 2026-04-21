import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatViewerCount } from '../../constants/mockData';
import ChatOverlay from '../../components/ChatOverlay';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { getMyProducts, createStream, updateStream, endStream, pinProduct } from '../../services/api';

const { width, height } = Dimensions.get('window');

const CATEGORIES = ['Fashion', 'Electronics', 'Food', 'Beauty', 'Shoes', 'Other'];

const SetupView = ({ onGoLive, navigation, isLoading, products, productsLoading, productsError, onRetryProducts }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [pinnedProduct, setPinnedProduct] = useState(null);

  const handleGoLive = () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Give your stream a title so viewers know what to expect.');
      return;
    }
    onGoLive({ title, category, pinnedProduct, products });
  };

  const renderProductsSection = () => {
    if (productsLoading) {
      return (
        <View style={styles.productsLoading}>
          <ActivityIndicator size="small" color={COLORS.gold} />
          <Text style={styles.productsLoadingText}>Loading your products...</Text>
        </View>
      );
    }
    if (productsError) {
      return (
        <TouchableOpacity style={styles.productsRetry} onPress={onRetryProducts}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.gold} />
          <Text style={styles.productsRetryText}>Retry</Text>
        </TouchableOpacity>
      );
    }
    if (products.length === 0) {
      return (
        <View style={styles.noProductsState}>
          <Text style={styles.noProductsText}>
            No products yet. Add products first before going live.
          </Text>
          <TouchableOpacity
            style={styles.addProductBtn}
            onPress={() => navigation.navigate('Products')}
          >
            <Ionicons name="add-circle-outline" size={16} color={COLORS.dark} />
            <Text style={styles.addProductBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return products.map((product) => (
      <TouchableOpacity
        key={product.id}
        style={[styles.productOption, pinnedProduct?.id === product.id && styles.productOptionActive]}
        onPress={() => setPinnedProduct(pinnedProduct?.id === product.id ? null : product)}
      >
        <LinearGradient colors={product.gradient || ['#4A0080', '#9B1DE8']} style={styles.productOptionThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={{ fontSize: 18 }}>🛍️</Text>
        </LinearGradient>
        <View style={styles.productOptionInfo}>
          <Text style={styles.productOptionName}>{product.name}</Text>
          <Text style={styles.productOptionPrice}>{formatCurrency(product.price, product.currency || 'NGN')}</Text>
        </View>
        {pinnedProduct?.id === product.id && (
          <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
        )}
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.setupCameraPreview}>
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="camera-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.cameraPreviewText}>Camera preview will appear here</Text>
        <Text style={styles.cameraPreviewSub}>Enable camera permissions in settings</Text>
      </View>

      <View style={styles.setupForm}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stream Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New Ankara arrivals — flash sale! 🔥"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Pin a product */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pin a Product</Text>
          <Text style={styles.sublabel}>Feature a product on your live stream</Text>
          {renderProductsSection()}
        </View>

        <TouchableOpacity
          style={[styles.goLiveBtn, isLoading && styles.goLiveBtnDisabled]}
          onPress={handleGoLive}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <View style={styles.goLiveDot} />
              <Text style={styles.goLiveBtnText}>Start Live Stream</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By going live you agree to AfriLive's Community Guidelines
        </Text>
      </View>
    </ScrollView>
  );
};

const LiveBroadcastView = ({ streamConfig, onEnd, user, liveProducts, streamId }) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [facing, setFacing] = useState('front');
  const [pinnedProduct, setPinnedProduct] = useState(streamConfig.pinnedProduct);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const liveTimer = useRef(0);
  const viewerCountRef = useRef(0);
  const [duration, setDuration] = useState('0:00');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    const viewerInterval = setInterval(() => {
      viewerCountRef.current += Math.floor(Math.random() * 15);
      setViewerCount(viewerCountRef.current);
    }, 3000);

    const timerInterval = setInterval(() => {
      liveTimer.current++;
      const mins = Math.floor(liveTimer.current / 60);
      const secs = liveTimer.current % 60;
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    // Sync viewer count to backend every 30 seconds
    const syncInterval = streamId
      ? setInterval(async () => {
          try { await updateStream(streamId, { viewerCount: viewerCountRef.current }); } catch {}
        }, 30000)
      : null;

    return () => {
      clearInterval(viewerInterval);
      clearInterval(timerInterval);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [streamId]);

  const handleEndLive = () => {
    Alert.alert('End Stream?', `You've been live for ${duration}. End the stream?`, [
      { text: 'Keep Streaming', style: 'cancel' },
      {
        text: 'End Live',
        style: 'destructive',
        onPress: async () => {
          if (streamId) {
            try { await endStream(streamId); } catch {}
          }
          onEnd();
        },
      },
    ]);
  };

  const handlePinProduct = async (item) => {
    setPinnedProduct(item);
    setShowProductPicker(false);
    if (streamId) {
      try { await pinProduct(streamId, item.id); } catch {}
    }
  };

  const handleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleCameraToggle = () => {
    setIsCameraOff(prev => !prev);
  };

  const handleFlipCamera = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />

      {/* Camera view */}
      <View style={StyleSheet.absoluteFill}>
        {isCameraOff ? (
          <LinearGradient colors={['#0D1B2A', '#1A3A5C']} style={StyleSheet.absoluteFill}>
            <View style={styles.broadcastPlaceholder}>
              <Ionicons name="videocam-off" size={56} color={COLORS.textMuted} />
              <Text style={styles.broadcastPlaceholderText}>Camera Off</Text>
            </View>
          </LinearGradient>
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mute={isMuted}
          />
        )}
      </View>

      {/* Dark overlay */}
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.broadcastTop, { paddingTop: insets.top + 10 }]}>
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveLabel}>LIVE</Text>
          <Text style={styles.liveDuration}>{duration}</Text>
        </View>
        <View style={styles.broadcastViewers}>
          <Ionicons name="eye" size={14} color={COLORS.white} />
          <Text style={styles.broadcastViewerCount}>{formatViewerCount(viewerCount)}</Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndLive}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Chat overlay */}
      <View style={styles.broadcastChat}>
        <ChatOverlay userName={user?.name} />
      </View>

      {/* Right controls */}
      <View style={styles.broadcastControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleMute}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? COLORS.red : COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleCameraToggle}>
          <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color={isCameraOff ? COLORS.red : COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleFlipCamera}>
          <Ionicons name="camera-reverse" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Pinned product bar */}
      <View style={styles.broadcastProductBar}>
        {pinnedProduct ? (
          <View style={styles.pinnedProductRow}>
            <LinearGradient colors={pinnedProduct.gradient || ['#4A0080', '#9B1DE8']} style={styles.pinnedProductThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 20 }}>🛍️</Text>
            </LinearGradient>
            <View style={styles.pinnedProductInfo}>
              <Text style={styles.pinnedProductName}>{pinnedProduct.name}</Text>
              <Text style={styles.pinnedProductPrice}>{formatCurrency(pinnedProduct.price, pinnedProduct.currency)}</Text>
            </View>
            <TouchableOpacity style={styles.changePinBtn} onPress={() => setShowProductPicker(true)}>
              <Text style={styles.changePinText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pinProductBtn} onPress={() => setShowProductPicker(true)}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.gold} />
            <Text style={styles.pinProductBtnText}>Pin a Product</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Product picker modal */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowProductPicker(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pin a Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Tap a product to pin it to your live stream</Text>
            <FlatList
              data={liveProducts || []}
              keyExtractor={(item) => item.id}
              style={styles.productList}
              renderItem={({ item }) => {
                const isSelected = pinnedProduct?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                    onPress={() => handlePinProduct(item)}
                  >
                    <LinearGradient
                      colors={item.gradient || ['#4A0080', '#9B1DE8']}
                      style={styles.pickerThumb}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={{ fontSize: 20 }}>🛍️</Text>
                    </LinearGradient>
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerName}>{item.name}</Text>
                      <Text style={styles.pickerPrice}>{formatCurrency(item.price, item.currency)}</Text>
                    </View>
                    {isSelected
                      ? <Ionicons name="checkmark-circle" size={24} color={COLORS.gold} />
                      : <Ionicons name="radio-button-off" size={24} color={COLORS.border} />
                    }
                  </TouchableOpacity>
                );
              }}
            />
            {pinnedProduct && (
              <TouchableOpacity
                style={styles.unpinBtn}
                onPress={() => { setPinnedProduct(null); setShowProductPicker(false); }}
              >
                <Text style={styles.unpinBtnText}>Remove Pin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function GoLiveScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [streamConfig, setStreamConfig] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await getMyProducts();
      setProducts(res.data || []);
      console.log('[GoLive] Loaded', res.data?.length, 'products');
    } catch (err) {
      console.error('[GoLive] loadProducts error:', err.response?.status, err.message);
      setProductsError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadProducts();
  }, [loadProducts]));

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();
    })();
  }, []);

  const handleGoLive = async (config) => {
    setIsStarting(true);
    const body = {
      title: config.title,
      category: config.category,
      pinnedProductId: config.pinnedProduct?.id || undefined,
    };
    console.log('[GoLive] createStream body:', JSON.stringify(body));
    try {
      const res = await createStream(body);
      console.log('[GoLive] createStream response:', JSON.stringify(res.data));
      setStreamId(res.data?.id || null);
      setLiveProducts(config.products || []);
      setStreamConfig(config);
      setIsLive(true);
    } catch (err) {
      console.error('[GoLive] createStream error:', err.response?.status, JSON.stringify(err.response?.data));
      Alert.alert('Failed to start stream', 'Failed to start stream. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndLive = () => {
    setIsLive(false);
    setStreamConfig(null);
    setLiveProducts([]);
    setStreamId(null);
  };

  if (isLive && streamConfig) {
    return (
      <LiveBroadcastView
        streamConfig={streamConfig}
        onEnd={handleEndLive}
        user={user}
        liveProducts={liveProducts}
        streamId={streamId}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.setupHeader}>
        <Text style={styles.setupTitle}>Go Live</Text>
        <Text style={styles.setupSubtitle}>Set up your broadcast</Text>
      </View>
      <SetupView
        onGoLive={handleGoLive}
        navigation={navigation}
        isLoading={isStarting}
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        onRetryProducts={loadProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  setupHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  setupTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  setupSubtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  setupScroll: { paddingBottom: 40 },
  setupCameraPreview: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cameraPreviewText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  cameraPreviewSub: { color: COLORS.textMuted, fontSize: 12 },
  setupForm: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 24 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  sublabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: 10, marginTop: -6 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: COLORS.white, fontSize: 15 },
  charCount: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  categoryScroll: { marginHorizontal: -20, paddingLeft: 20 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  categoryChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: COLORS.dark },
  productOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  productOptionActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(232,160,32,0.08)' },
  productOptionThumb: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productOptionInfo: { flex: 1 },
  productOptionName: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  productOptionPrice: { color: COLORS.gold, fontSize: 13, fontWeight: '700', marginTop: 2 },
  goLiveBtn: { backgroundColor: COLORS.liveRed, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 8, shadowColor: COLORS.liveRed, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  goLiveBtnDisabled: { opacity: 0.6 },
  goLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white },
  goLiveBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  disclaimer: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  // Broadcast styles
  broadcastTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, zIndex: 10, gap: 10 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.liveRed, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  liveLabel: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  liveDuration: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  broadcastViewers: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  broadcastViewerCount: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  endBtn: { backgroundColor: 'rgba(192,57,43,0.85)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  endBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  broadcastChat: { position: 'absolute', left: 12, bottom: 100, width: width * 0.65, zIndex: 10 },
  broadcastControls: { position: 'absolute', right: 12, bottom: 200, gap: 16, zIndex: 10 },
  controlBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  broadcastProductBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(14,14,14,0.95)', paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.border, zIndex: 10 },
  pinnedProductRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinnedProductThumb: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pinnedProductInfo: { flex: 1 },
  pinnedProductName: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  pinnedProductPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800' },
  changePinBtn: { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  changePinText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  pinProductBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pinProductBtnText: { color: COLORS.gold, fontSize: 15, fontWeight: '700' },
  broadcastPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  broadcastPlaceholderText: { color: COLORS.textMuted, fontSize: 14 },
  // Product picker modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  modalSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: 16 },
  productList: { flexGrow: 0 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 12, marginBottom: 10,
  },
  pickerRowActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(232,160,32,0.08)' },
  pickerThumb: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickerInfo: { flex: 1 },
  pickerName: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  pickerPrice: { color: COLORS.gold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  unpinBtn: {
    marginTop: 8, height: 46, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.red, alignItems: 'center', justifyContent: 'center',
  },
  unpinBtnText: { color: COLORS.red, fontSize: 14, fontWeight: '700' },
  productsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  productsLoadingText: { color: COLORS.textMuted, fontSize: 13 },
  productsRetry: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  productsRetryText: { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
  noProductsState: { alignItems: 'center', paddingVertical: 20, gap: 14 },
  noProductsText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  addProductBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.gold, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  addProductBtnText: { color: COLORS.dark, fontSize: 14, fontWeight: '700' },
});
