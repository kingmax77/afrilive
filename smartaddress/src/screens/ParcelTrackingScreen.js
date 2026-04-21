import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
  Modal,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import StatusTimeline from '../components/StatusTimeline';
import { colors } from '../theme/colors';
import { getOrdersBySmartAddress } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_MAP_HEIGHT = 160;
const POLL_INTERVAL_MS = 10_000;

// Handles both backend uppercase enum and legacy lowercase values
const AFRILIVE_STATUS_MAP = {
  CONFIRMED:         'placed',
  PICKED_UP:         'picked',
  IN_TRANSIT:        'transit',
  OUT_FOR_DELIVERY:  'out',
  DELIVERED:         'delivered',
  CANCELLED:         'placed',
  confirmed:         'placed',
  picked_up:         'picked',
  in_transit:        'transit',
  out_for_delivery:  'out',
  delivered:         'delivered',
};

const TOAST_MESSAGES = {
  PICKED_UP:        '📦 Your order has been picked up!',
  IN_TRANSIT:       '🛵 Your order is on the way!',
  OUT_FOR_DELIVERY: '🛵 Your order is out for delivery!',
  DELIVERED:        '🎉 Your order has been delivered!',
};

const STATUS_BADGES = {
  placed:    { label: 'Order Placed',      bg: colors.darkBorder,         text: colors.textMuted },
  picked:    { label: 'Picked Up',         bg: '#0F4A2820',               text: colors.green },
  transit:   { label: 'In Transit',        bg: `${colors.gold}20`,        text: colors.gold },
  out:       { label: 'Out for Delivery',  bg: `${colors.gold}30`,        text: colors.goldDark },
  delivered: { label: 'Delivered',         bg: `${colors.green}25`,       text: colors.green },
};

/**
 * Transforms raw orders from the backend API (GET /orders/smartaddress/:code)
 * or legacy AfriLive local format into the internal delivery shape.
 *
 * Backend format: { id, status (UPPERCASE enum), product: { name }, seller: { name },
 *   delivery: { currentLat, currentLng, pickedUpAt, deliveredAt, rider: { name, phone } },
 *   smartAddressCode, createdAt }
 */
function transformAfriLiveOrders(afriliveOrders, addresses) {
  if (!Array.isArray(afriliveOrders) || afriliveOrders.length === 0) return [];
  if (!Array.isArray(addresses)) return [];

  return afriliveOrders.reduce((acc, order) => {
    const address = addresses.find((a) => a.code === order.smartAddressCode);
    if (!address) return acc;

    const internalStatus = AFRILIVE_STATUS_MAP[order.status] ?? 'placed';

    // Support both backend nested format and legacy flat format
    const productName = order.product?.name ?? order.productName ?? 'Order';
    const sellerName  = order.seller?.name  ?? order.sellerName  ?? 'Seller';

    // Rider info — backend: delivery.rider / legacy: flat riderName/riderPhone
    const deliveryData = order.delivery;
    const riderFromDelivery = deliveryData?.rider;
    const rider = riderFromDelivery
      ? { name: riderFromDelivery.name, phone: riderFromDelivery.phone, vehicle: null }
      : order.riderName
      ? { name: order.riderName, phone: order.riderPhone, vehicle: order.riderVehicle ?? null }
      : null;

    // Real GPS coordinates from backend delivery record
    const hasRealCoords = deliveryData?.currentLat != null && deliveryData?.currentLng != null;
    const realRiderCoord = hasRealCoords
      ? { latitude: Number(deliveryData.currentLat), longitude: Number(deliveryData.currentLng) }
      : null;

    // Deterministic offset for simulated fallback animation
    const seed = order.id ? order.id.charCodeAt(0) / 255 : 0.5;
    const riderStartOffset = {
      dLat: (seed - 0.5) * 0.04,
      dLng: (seed - 0.3) * 0.04,
    };

    // Build timestamps from backend fields with legacy fallback
    const ts = order.timestamps ?? {};
    const fmt = (d) => (d ? new Date(d).toLocaleString() : undefined);
    const timestamps = {};
    const placed    = fmt(order.createdAt)            ?? ts.confirmed;
    const picked    = fmt(deliveryData?.pickedUpAt)   ?? ts.picked_up;
    const transit   = ts.in_transit;
    const out       = ts.out_for_delivery;
    const delivered = fmt(deliveryData?.deliveredAt)  ?? ts.delivered;
    if (placed)    timestamps.placed    = placed;
    if (picked)    timestamps.picked    = picked;
    if (transit)   timestamps.transit   = transit;
    if (out)       timestamps.out       = out;
    if (delivered) timestamps.delivered = delivered;

    const etaMinutes = parseInt(order.estimatedDelivery) || order.etaMinutes || 30;

    acc.push({
      id:             `afrilive-${order.id}`,
      orderId:        order.orderId ?? order.id,
      orderLabel:     `${productName} · AfriLive Order`,
      parcelName:     productName,
      sellerName,
      sellerLocation: order.sellerLocation ?? 'AfriLive Market',
      parcelSize:     order.parcelSize ?? null,
      status:         internalStatus,
      etaMinutes,
      address,
      rider,
      timestamps,
      riderStartOffset,
      realRiderCoord,
      source:         'afrilive',
    });

    return acc;
  }, []);
}

function getRiderStart(address, offset) {
  return {
    latitude:  address.latitude  + offset.dLat,
    longitude: address.longitude + offset.dLng,
  };
}

function interpolate(start, end, t) {
  return {
    latitude:  start.latitude  + (end.latitude  - start.latitude)  * t,
    longitude: start.longitude + (end.longitude - start.longitude) * t,
  };
}

function haversineMeters(a, b) {
  if (!a || !b) return 0;
  const R = 6371000;
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude  * Math.PI) / 180;
  const lat2 = (b.latitude  * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Pulsing gold dot shown on map when no rider is assigned yet
function PulsingRiderMarker({ coordinate }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 2.0, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: `${colors.gold}30`,
            transform: [{ scale }],
          }}
        />
        <View style={{
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: colors.gold,
          borderWidth: 2, borderColor: colors.white,
        }} />
      </View>
    </Marker>
  );
}

// ── Main screen ──────────────────────────────────────────────────────
export default function ParcelTrackingScreen() {
  const { addresses: rawAddresses, primaryAddress } = useContext(AddressContext);
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];

  const [afriliveOrders, setAfriliveOrders] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  // ── Toast system ──────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState(null);
  const toastOpacity                    = useRef(new Animated.Value(0)).current;
  const toastQueue                      = useRef([]);
  const isToastRunning                  = useRef(false);

  const runNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isToastRunning.current = false;
      return;
    }
    isToastRunning.current = true;
    const msg = toastQueue.current[0];
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      toastQueue.current.shift();
      runNextToast();
    });
  }, [toastOpacity]);

  const showToast = useCallback((message) => {
    toastQueue.current.push(message);
    if (!isToastRunning.current) runNextToast();
  }, [runNextToast]);

  // Tracks the last known status per order id — used to detect status changes
  const prevStatusMapRef = useRef({});

  const loadOrders = useCallback(async () => {
    if (!primaryAddress?.code) return;
    try {
      setError(null);
      const data = await getOrdersBySmartAddress(primaryAddress.code);
      const orders = Array.isArray(data) ? data : [];

      // Fire toasts only when status has changed from a previously seen value
      orders.forEach((order) => {
        const prev = prevStatusMapRef.current[order.id];
        if (prev !== undefined && prev !== order.status) {
          const msg = TOAST_MESSAGES[order.status];
          if (msg) showToast(msg);
        }
        prevStatusMapRef.current[order.id] = order.status;
      });

      setAfriliveOrders(orders);
    } catch (e) {
      setError('Could not load deliveries. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [primaryAddress?.code, showToast]);

  // Initial load
  useEffect(() => {
    if (primaryAddress?.code) setLoading(true);
    loadOrders();
  }, [primaryAddress?.code]);

  // Poll every 10 s
  useEffect(() => {
    const timer = setInterval(loadOrders, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const deliveries = useMemo(
    () => transformAfriLiveOrders(afriliveOrders, addresses),
    [afriliveOrders, addresses]
  );

  // Rider positions: real GPS takes priority, else simulated animation
  const progressRefs = useRef({});
  const [positions, setPositions] = useState({});

  // Set initial positions and apply real-coord updates on every deliveries change
  useEffect(() => {
    if (deliveries.length === 0) return;
    const updates = {};
    deliveries.forEach((d) => {
      if (d.realRiderCoord) {
        // Always update to latest real coords from the API
        updates[d.id] = d.realRiderCoord;
        progressRefs.current[d.id] = null; // null = using real coords
      } else if (progressRefs.current[d.id] == null) {
        // First time seeing this delivery — start simulated position
        progressRefs.current[d.id] = 0;
        updates[d.id] = getRiderStart(d.address, d.riderStartOffset);
      }
    });
    if (Object.keys(updates).length > 0) {
      setPositions((prev) => ({ ...prev, ...updates }));
    }
  }, [deliveries]);

  // Animate rider dot only for deliveries that have a rider but no real GPS data
  useEffect(() => {
    const simDeliveries = deliveries.filter((d) => d.rider && !d.realRiderCoord);
    if (simDeliveries.length === 0) return;
    const interval = setInterval(() => {
      const next = {};
      simDeliveries.forEach((d) => {
        const p = Math.min((progressRefs.current[d.id] ?? 0) + 0.003, 0.97);
        progressRefs.current[d.id] = p;
        next[d.id] = interpolate(
          getRiderStart(d.address, d.riderStartOffset),
          { latitude: d.address.latitude, longitude: d.address.longitude },
          p
        );
      });
      setPositions((prev) => ({ ...prev, ...next }));
    }, 1500);
    return () => clearInterval(interval);
  }, [deliveries]);

  const hasAddresses = addresses.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        {deliveries.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{deliveries.length} live</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Loading deliveries…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={44} color={colors.darkBorder} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadOrders} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !hasAddresses ? (
          <EmptyState
            icon="location-outline"
            title="No Saved Addresses"
            desc="Save a SmartAddress first — deliveries destined for your addresses will appear here automatically."
          />
        ) : deliveries.length === 0 ? (
          <EmptyState
            icon="bicycle-outline"
            title="No active deliveries 🛵"
            desc={'Orders from AfriLive Market will\nappear here automatically'}
          />
        ) : (
          <View style={styles.cardsList}>
            {deliveries.map((delivery) => {
              const riderPos = positions[delivery.id];
              const progress = progressRefs.current[delivery.id] ?? 0;
              const dest = { latitude: delivery.address.latitude, longitude: delivery.address.longitude };
              const distM = haversineMeters(riderPos, dest);
              const etaRemaining = Math.max(1, Math.round(delivery.etaMinutes * (1 - (progress ?? 0))));
              const badge = STATUS_BADGES[delivery.status] ?? STATUS_BADGES.transit;

              return (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  riderPos={riderPos}
                  dest={dest}
                  etaRemaining={etaRemaining}
                  distanceKm={(distM / 1000).toFixed(1)}
                  badge={badge}
                />
              );
            })}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Toast notification — floats above all content */}
      {toastMessage ? (
        <Animated.View
          style={[styles.toastBanner, { opacity: toastOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

// ── Delivery card component ──────────────────────────────────────────
function DeliveryCard({ delivery, riderPos, dest, etaRemaining, distanceKm, badge }) {
  const mapRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const isAfrilive = delivery.source === 'afrilive';

  // Fit mini map once rider position is known
  useEffect(() => {
    if (!riderPos) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates([riderPos, dest], {
        edgePadding: { top: 28, right: 20, bottom: 28, left: 20 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [!!riderPos]); // only on first position arrival

  return (
    <View style={styles.card}>
      {/* ── Mini map (tappable → fullscreen) ── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setFullscreenVisible(true)}
        style={styles.miniMapContainer}
      >
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          mapType="satellite"
          initialRegion={{
            latitude: dest.latitude,
            longitude: dest.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Rider dot (when rider is assigned) or pulsing awaiting indicator */}
          {delivery.rider ? (
            riderPos ? (
              <Marker coordinate={riderPos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.riderDot}>
                  <Ionicons name="bicycle" size={14} color={colors.white} />
                </View>
              </Marker>
            ) : null
          ) : (
            <PulsingRiderMarker coordinate={dest} />
          )}

          {/* Destination pin */}
          <Marker coordinate={dest}>
            <Ionicons name="location" size={32} color={colors.green} />
          </Marker>

          {/* Route polyline — only shown when rider is en route */}
          {delivery.rider && riderPos && (
            <Polyline
              coordinates={[riderPos, dest]}
              strokeColor={colors.gold}
              strokeWidth={3}
              lineDashPattern={[6, 3]}
            />
          )}
        </MapView>

        {/* ETA overlay */}
        <View style={styles.etaOverlay} pointerEvents="none">
          <Text style={styles.etaNum}>{etaRemaining} min</Text>
          <Text style={styles.etaDist}>{distanceKm} km away</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]} pointerEvents="none">
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>

        {/* Awaiting rider label on map */}
        {!delivery.rider && (
          <View style={styles.awaitingLabel} pointerEvents="none">
            <Ionicons name="time-outline" size={11} color={colors.gold} />
            <Text style={styles.awaitingLabelText}>Awaiting rider</Text>
          </View>
        )}

        {/* Expand hint */}
        <View style={styles.expandHint} pointerEvents="none">
          <Ionicons name="expand-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.expandHintText}>Tap to expand</Text>
        </View>
      </TouchableOpacity>

      {/* ── Card body ── */}
      <View style={styles.cardBody}>
        {/* AfriLive source badge */}
        {isAfrilive && (
          <View style={styles.afriliveBadgeRow}>
            <View style={styles.afriliveBadge}>
              <Ionicons name="flash" size={10} color={colors.gold} />
              <Text style={styles.afriliveBadgeText}>AfriLive Market</Text>
            </View>
          </View>
        )}

        {/* Destination address + ℹ️ button */}
        <View style={styles.destRow}>
          <View style={styles.destIconBox}>
            <Ionicons name="location" size={16} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destCode}>{delivery.address.code}</Text>
            <Text style={styles.destLabel}>{delivery.address.label}</Text>
          </View>
          <View style={styles.orderIdTag}>
            <Text style={styles.orderIdText}>{delivery.orderId}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setTooltipVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.infoBtnText}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        {/* Order label */}
        <View style={styles.orderRow}>
          <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
          <Text style={styles.orderLabel}>{delivery.orderLabel}</Text>
        </View>

        {/* Rider row */}
        {delivery.rider ? (
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={16} color={colors.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{delivery.rider.name}</Text>
              <Text style={styles.riderVehicle}>{delivery.rider.vehicle ?? 'Rider'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${delivery.rider.phone}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={16} color={colors.white} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noRiderRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.noRiderText}>Awaiting rider assignment</Text>
          </View>
        )}

        {/* Expandable timeline */}
        <TouchableOpacity
          style={styles.timelineToggle}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.75}
        >
          <Text style={styles.timelineToggleText}>
            {expanded ? 'Hide timeline' : 'Show delivery timeline'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.gold}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.timelineWrap}>
            <StatusTimeline
              currentStage={delivery.status}
              timestamps={delivery.timestamps}
            />
          </View>
        )}
      </View>

      {/* ── Parcel tooltip modal ── */}
      <ParcelTooltip
        visible={tooltipVisible}
        onClose={() => setTooltipVisible(false)}
        delivery={delivery}
      />

      {/* ── Fullscreen satellite map modal ── */}
      <FullscreenMapModal
        visible={fullscreenVisible}
        onClose={() => setFullscreenVisible(false)}
        delivery={delivery}
        riderPos={riderPos}
        dest={dest}
        etaRemaining={etaRemaining}
        distanceKm={distanceKm}
        badge={badge}
      />
    </View>
  );
}

// ── Parcel identity tooltip ──────────────────────────────────────────
function ParcelTooltip({ visible, onClose, delivery }) {
  const SIZE_LABELS = { Small: '📦 Small package', Medium: '📦 Medium package', Large: '📦 Large package' };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={tooltipStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={tooltipStyles.box}>
              <Text style={tooltipStyles.parcelName}>{delivery.parcelName}</Text>

              <View style={tooltipStyles.row}>
                <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
                <Text style={tooltipStyles.detail}>from {delivery.sellerName}</Text>
              </View>

              <View style={tooltipStyles.row}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={tooltipStyles.detail}>{delivery.sellerLocation}</Text>
              </View>

              {delivery.parcelSize ? (
                <View style={tooltipStyles.row}>
                  <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                  <Text style={tooltipStyles.detail}>
                    {SIZE_LABELS[delivery.parcelSize] ?? delivery.parcelSize}
                  </Text>
                </View>
              ) : null}

              <View style={tooltipStyles.divider} />
              <Text style={tooltipStyles.dismiss}>Tap outside to dismiss</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Fullscreen satellite map modal ────────────────────────────────────
function FullscreenMapModal({ visible, onClose, delivery, riderPos, dest, etaRemaining, distanceKm, badge }) {
  const insets = useSafeAreaInsets();
  const fsMapRef = useRef(null);

  useEffect(() => {
    if (!visible || !riderPos) return;
    const t = setTimeout(() => {
      fsMapRef.current?.fitToCoordinates([riderPos, dest], {
        edgePadding: { top: 140, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [visible, !!riderPos]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={fsStyles.container}>
        {/* Full-screen satellite map */}
        <MapView
          ref={fsMapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          mapType="satellite"
          initialRegion={{
            latitude: dest.latitude,
            longitude: dest.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Rider dot or pulsing awaiting indicator */}
          {delivery.rider ? (
            riderPos ? (
              <Marker coordinate={riderPos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={fsStyles.riderDot}>
                  <Ionicons name="bicycle" size={18} color={colors.dark} />
                </View>
              </Marker>
            ) : null
          ) : (
            <PulsingRiderMarker coordinate={dest} />
          )}

          {/* Destination pin */}
          <Marker coordinate={dest} title={delivery.address.label}>
            <View style={fsStyles.destPin}>
              <Ionicons name="location" size={44} color={colors.green} />
            </View>
          </Marker>

          {/* Route polyline */}
          {delivery.rider && riderPos && (
            <Polyline
              coordinates={[riderPos, dest]}
              strokeColor={colors.gold}
              strokeWidth={4}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* Back button */}
        <TouchableOpacity
          style={[fsStyles.backBtn, { top: insets.top + 14 }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
          <Text style={fsStyles.backBtnText}>Back to Tracking</Text>
        </TouchableOpacity>

        {/* Floating info card */}
        <View style={[fsStyles.infoCard, { top: insets.top + 66 }]}>
          <View style={fsStyles.infoCardEtaRow}>
            <View>
              <Text style={fsStyles.infoCardEta}>{etaRemaining} min</Text>
              <Text style={fsStyles.infoCardDist}>{distanceKm} km away</Text>
            </View>
            <View style={[fsStyles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[fsStyles.statusPillText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>

          {delivery.rider ? (
            <View style={fsStyles.riderRow}>
              <View style={fsStyles.riderAvatar}>
                <Ionicons name="person" size={15} color={colors.dark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={fsStyles.riderName}>{delivery.rider.name}</Text>
                <Text style={fsStyles.riderVehicle}>{delivery.rider.vehicle ?? 'Rider'}</Text>
              </View>
              <TouchableOpacity
                style={fsStyles.callBtn}
                onPress={() => Linking.openURL(`tel:${delivery.rider.phone}`)}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={15} color={colors.white} />
                <Text style={fsStyles.callBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={fsStyles.riderRow}>
              <Ionicons name="time-outline" size={14} color={colors.gold} />
              <Text style={[fsStyles.riderVehicle, { color: colors.gold, fontStyle: 'italic' }]}>
                Awaiting rider assignment
              </Text>
            </View>
          )}
        </View>

        {/* Destination label */}
        <View style={[fsStyles.destCard, { bottom: insets.bottom + 20 }]}>
          <Ionicons name="location" size={18} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={fsStyles.destCode}>{delivery.address.code}</Text>
            <Text style={fsStyles.destLabel}>{delivery.address.label}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Empty state ──────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyIconRing}>
          <Ionicons name={icon} size={44} color={colors.darkBorder} />
        </View>
        <View style={[styles.pulseRing, { width: 90, height: 90, opacity: 0.15 }]} />
        <View style={[styles.pulseRing, { width: 120, height: 120, opacity: 0.08 }]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{desc}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },

  // Header
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
    borderBottomWidth: 1, borderColor: colors.darkBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.white },
  headerBadge: {
    backgroundColor: colors.greenFaded,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${colors.green}40`,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: colors.green },

  // Loading / error
  loadingState: { alignItems: 'center', paddingTop: 80, gap: 16 },
  loadingText: { fontSize: 14, color: colors.textMuted },
  errorState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 16 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: colors.darkCard, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: colors.gold },

  // Cards list
  cardsList: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  // Card
  card: {
    backgroundColor: colors.darkCard,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },

  // Mini map
  miniMapContainer: { height: MINI_MAP_HEIGHT, position: 'relative' },
  riderDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.green,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  etaOverlay: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: `${colors.gold}40`,
  },
  etaNum: { fontSize: 18, fontWeight: '900', color: colors.gold, lineHeight: 22 },
  etaDist: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  awaitingLabel: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(10,10,10,0.75)',
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: `${colors.gold}40`,
  },
  awaitingLabelText: { fontSize: 11, color: colors.gold, fontWeight: '600' },
  expandHint: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  expandHintText: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },

  // Card body
  cardBody: { padding: 16, gap: 12 },

  // Destination
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  destIconBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  destCode: { fontSize: 16, fontWeight: '800', color: colors.gold, fontFamily: 'monospace', letterSpacing: 1 },
  destLabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  orderIdTag: {
    backgroundColor: colors.darkSurface,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  orderIdText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  infoBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  infoBtnText: { fontSize: 18 },

  // AfriLive badge
  afriliveBadgeRow: { flexDirection: 'row' },
  afriliveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${colors.gold}18`,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: `${colors.gold}40`,
    alignSelf: 'flex-start',
  },
  afriliveBadgeText: { fontSize: 10, fontWeight: '700', color: colors.gold },

  // Order label
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.darkSurface,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  orderLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },

  // Rider
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noRiderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.darkSurface,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  noRiderText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  riderAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  riderName: { fontSize: 14, fontWeight: '700', color: colors.white },
  riderVehicle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  // Timeline toggle
  timelineToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1, borderColor: colors.darkBorder,
  },
  timelineToggleText: { fontSize: 12, fontWeight: '600', color: colors.gold },
  timelineWrap: { paddingTop: 8 },

  // Toast banner
  toastBanner: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15,15,15,0.95)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: `${colors.gold}50`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 64, gap: 16 },
  emptyIllustration: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 8,
  },
  emptyIconRing: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.darkCard,
    borderWidth: 1, borderColor: colors.darkBorder,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.white, textAlign: 'center' },
  emptyDesc: {
    fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21,
    maxWidth: 300,
  },
});

// ── Tooltip styles ────────────────────────────────────────────────────
const tooltipStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  box: {
    width: '100%',
    backgroundColor: colors.dark,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    gap: 10,
  },
  parcelName: { fontSize: 20, fontWeight: '800', color: colors.gold, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detail: { fontSize: 14, color: colors.white, fontWeight: '500', flex: 1 },
  divider: { height: 1, backgroundColor: colors.darkBorder, marginVertical: 4 },
  dismiss: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});

// ── Fullscreen map styles ─────────────────────────────────────────────
const fsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  backBtn: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: `${colors.gold}50`,
    zIndex: 10,
  },
  backBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  infoCard: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(10,10,10,0.90)',
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: `${colors.gold}35`,
    zIndex: 10,
  },
  infoCardEtaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  infoCardEta: { fontSize: 26, fontWeight: '900', color: colors.gold, lineHeight: 30 },
  infoCardDist: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  riderAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  riderName: { fontSize: 14, fontWeight: '700', color: colors.white },
  riderVehicle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.green,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  riderDot: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  destPin: { alignItems: 'center' },
  destCard: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(10,10,10,0.90)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: `${colors.green}40`,
    zIndex: 10,
  },
  destCode: {
    fontSize: 16, fontWeight: '800', color: colors.green,
    fontFamily: 'monospace', letterSpacing: 1,
  },
  destLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
