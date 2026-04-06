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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import StatusTimeline from '../components/StatusTimeline';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_MAP_HEIGHT = 160;

const AFRILIVE_STORAGE_KEY = 'SMARTADDRESS_SHARED_ORDERS';
const POLL_INTERVAL_MS = 10_000;

// Maps AfriLive status strings → internal status keys used by STATUS_BADGES / StatusTimeline
const AFRILIVE_STATUS_MAP = {
  confirmed:        'placed',
  picked_up:        'picked',
  in_transit:       'transit',
  out_for_delivery: 'out',
  delivered:        'delivered',
};

// ── Mock rider data ──────────────────────────────────────────────────
const MOCK_RIDERS = [
  { name: 'James Okafor',  phone: '+254712345678', vehicle: 'Boda Boda · KDE 234A' },
  { name: 'Amara Diallo',  phone: '+234803456789', vehicle: 'Motorbike · LOS 891B' },
];

const STATUS_BADGES = {
  placed:    { label: 'Order Placed',      bg: colors.darkBorder,         text: colors.textMuted },
  picked:    { label: 'Picked Up',         bg: '#0F4A2820',               text: colors.green },
  transit:   { label: 'In Transit',        bg: `${colors.gold}20`,        text: colors.gold },
  out:       { label: 'Out for Delivery',  bg: `${colors.gold}30`,        text: colors.goldDark },
  delivered: { label: 'Delivered',         bg: `${colors.green}25`,       text: colors.green },
};

/**
 * Convert raw AfriLive orders (from AsyncStorage) into the internal delivery shape.
 * Matches each order's smartAddressCode to a saved address for lat/lng.
 *
 * Expected AfriLive order shape written by AfriLive app:
 * {
 *   id, orderId, productName, sellerName, smartAddressCode,
 *   status: 'confirmed'|'picked_up'|'in_transit'|'out_for_delivery'|'delivered',
 *   rider: null | { name, phone, vehicle },
 *   timestamps: { confirmed?, picked_up?, in_transit?, out_for_delivery?, delivered? },
 *   etaMinutes?,
 * }
 */
function transformAfriLiveOrders(afriliveOrders, addresses) {
  if (!afriliveOrders || afriliveOrders.length === 0) return [];

  return afriliveOrders.reduce((acc, order) => {
    const address = addresses.find((a) => a.code === order.smartAddressCode);
    if (!address) return acc; // skip if we can't resolve the address locally

    const internalStatus = AFRILIVE_STATUS_MAP[order.status] ?? 'placed';

    // Deterministic pseudo-random offset so the rider dot starts away from the pin
    const seed = order.id ? order.id.charCodeAt(0) / 255 : 0.5;
    const riderStartOffset = {
      dLat: (seed - 0.5) * 0.04,
      dLng: (seed - 0.3) * 0.04,
    };

    // Remap AfriLive timestamp keys to internal keys
    const ts = order.timestamps ?? {};
    const timestamps = {};
    if (ts.confirmed)        timestamps.placed  = ts.confirmed;
    if (ts.picked_up)        timestamps.picked  = ts.picked_up;
    if (ts.in_transit)       timestamps.transit = ts.in_transit;
    if (ts.out_for_delivery) timestamps.out     = ts.out_for_delivery;
    if (ts.delivered)        timestamps.delivered = ts.delivered;

    // AfriLive writes flat riderName/riderPhone fields (not a nested rider object)
    const rider = order.riderName
      ? { name: order.riderName, phone: order.riderPhone, vehicle: order.riderVehicle ?? null }
      : null;

    // AfriLive writes estimatedDelivery as a string like "45 mins"
    const etaMinutes = parseInt(order.estimatedDelivery) || order.etaMinutes || 30;

    acc.push({
      id:              `afrilive-${order.id}`,
      orderId:         order.orderId ?? order.id,
      orderLabel:      `${order.productName} · AfriLive Order`,
      parcelName:      order.productName,
      sellerName:      order.sellerName,
      sellerLocation:  order.sellerLocation ?? 'AfriLive Market',
      parcelSize:      order.parcelSize ?? null,
      status:          internalStatus,
      etaMinutes,
      address,
      rider,
      timestamps,
      riderStartOffset,
      source:          'afrilive',
    });

    return acc;
  }, []);
}

/**
 * Build 2 mock active deliveries.
 * Each one targets a different saved address (or the same one twice if only 1 address).
 */
function buildMockDeliveries(addresses) {
  if (!addresses || addresses.length === 0) return [];

  const addr0 = addresses[0];
  const addr1 = addresses.length > 1 ? addresses[1] : addresses[0];

  return [
    {
      id: 'mock-1',
      orderId: 'SA-LIVE-2847',
      orderLabel: 'Ankara Dress · AfriLive Order',
      parcelName: 'Ankara Dress',
      sellerName: 'Adaeze Boutique',
      sellerLocation: 'Lekki, Lagos',
      parcelSize: 'Medium',
      status: 'transit',
      etaMinutes: 22,
      address: addr0,
      rider: MOCK_RIDERS[0],
      timestamps: {
        placed: 'Today 8:02 AM',
        picked: 'Today 9:18 AM',
        transit: 'Today 9:45 AM',
      },
      riderStartOffset: { dLat: +0.028, dLng: -0.020 },
    },
    {
      id: 'mock-2',
      orderId: 'SA-LIVE-3021',
      orderLabel: 'Wireless Earbuds · AfriLive Order',
      parcelName: 'Wireless Earbuds',
      sellerName: 'TechHub Store',
      sellerLocation: 'Victoria Island, Lagos',
      parcelSize: 'Small',
      status: 'out',
      etaMinutes: 9,
      address: addr1,
      rider: MOCK_RIDERS[1],
      timestamps: {
        placed: 'Today 7:30 AM',
        picked: 'Today 8:45 AM',
        transit: 'Today 9:00 AM',
        out:    'Today 9:52 AM',
      },
      riderStartOffset: { dLat: -0.012, dLng: +0.016 },
    },
  ];
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

/**
 * DEV HELPER — seeds a realistic AfriLive order into AsyncStorage using the
 * first saved SmartAddress code. Tap the "Seed Test Order" button to invoke.
 * Remove before production.
 */
async function seedTestAfriLiveOrder(addresses) {
  if (!addresses || addresses.length === 0) {
    alert('Save a SmartAddress first, then seed.');
    return;
  }
  const addr = addresses[0];
  const existing = await AsyncStorage.getItem(AFRILIVE_STORAGE_KEY);
  const list = existing ? JSON.parse(existing) : [];
  const now = Date.now();
  const testOrder = {
    id:               `test_${now}`,
    productName:      'Ankara Dress',
    sellerName:       'Adaeze Boutique',
    sellerLocation:   'Lekki, Lagos',
    price:            18500,
    currency:         '₦',
    smartAddressCode: addr.code,       // uses the user's real saved code
    status:           'in_transit',
    riderName:        'Seun Adeyemi',
    riderPhone:       '+234 803 987 6543',
    riderVehicle:     'Boda Boda · LGS 441K',
    riderLocation:    null,
    estimatedDelivery: '22 mins',
    orderedAt:        now,
    updatedAt:        now,
    timestamps: {
      confirmed:  'Today 9:02 AM',
      picked_up:  'Today 9:38 AM',
      in_transit: 'Today 9:55 AM',
    },
  };
  await AsyncStorage.setItem(
    AFRILIVE_STORAGE_KEY,
    JSON.stringify([testOrder, ...list])
  );
}

// ── Main screen ──────────────────────────────────────────────────────
export default function ParcelTrackingScreen() {
  const { addresses } = useContext(AddressContext);

  // AfriLive orders read from AsyncStorage
  const [afriliveOrders, setAfriliveOrders] = useState([]);

  const loadAfriliveOrders = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(AFRILIVE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAfriliveOrders(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.warn('ParcelTracking: failed to load AfriLive orders', e);
    }
  }, []);

  // Load on mount, then poll every 10 s
  useEffect(() => {
    loadAfriliveOrders();
    const timer = setInterval(loadAfriliveOrders, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadAfriliveOrders]);

  // Build merged deliveries: real AfriLive orders first, mock as fallback
  const deliveries = useMemo(() => {
    const live = transformAfriLiveOrders(afriliveOrders, addresses);
    const mock = buildMockDeliveries(addresses);
    // Show mock deliveries only when there are no real AfriLive orders
    return live.length > 0 ? live : mock;
  }, [afriliveOrders, addresses]);

  // Progress per delivery id
  const progressRefs = useRef({});
  const [positions, setPositions] = useState({});

  // Initialise starting positions whenever the deliveries list changes
  useEffect(() => {
    if (deliveries.length === 0) return;
    const initial = {};
    deliveries.forEach((d) => {
      if (progressRefs.current[d.id] == null) {
        progressRefs.current[d.id] = 0;
      }
      initial[d.id] = getRiderStart(d.address, d.riderStartOffset);
    });
    setPositions((prev) => ({ ...prev, ...initial }));
  }, [deliveries]);

  // Animate all riders simultaneously with one interval
  useEffect(() => {
    if (deliveries.length === 0) return;
    const interval = setInterval(() => {
      const next = {};
      deliveries.forEach((d) => {
        const p = Math.min((progressRefs.current[d.id] ?? 0) + 0.003, 0.97);
        progressRefs.current[d.id] = p;
        next[d.id] = interpolate(
          getRiderStart(d.address, d.riderStartOffset),
          { latitude: d.address.latitude, longitude: d.address.longitude },
          p
        );
      });
      setPositions(next);
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
        {/* DEV: seed a test AfriLive order using the first saved address code */}
        <TouchableOpacity
          style={styles.seedBtn}
          onPress={() => seedTestAfriLiveOrder(addresses).then(loadAfriliveOrders)}
          activeOpacity={0.75}
        >
          <Ionicons name="flask-outline" size={13} color={colors.gold} />
          <Text style={styles.seedBtnText}>Seed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasAddresses ? (
          /* No saved addresses yet */
          <EmptyState
            icon="location-outline"
            title="No Saved Addresses"
            desc="Save a SmartAddress first — deliveries destined for your addresses will appear here automatically."
          />
        ) : deliveries.length === 0 ? (
          /* Has addresses but no active deliveries */
          <EmptyState
            icon="cube-outline"
            title="No Active Deliveries"
            desc="When a rider is on the way to any of your saved addresses, they'll show up here in real time."
          />
        ) : (
          /* Delivery cards */
          <View style={styles.cardsList}>
            {deliveries.map((delivery) => {
              const riderPos = positions[delivery.id];
              const progress = progressRefs.current[delivery.id] ?? 0;
              const dest = { latitude: delivery.address.latitude, longitude: delivery.address.longitude };
              const distM = haversineMeters(riderPos, dest);
              const etaRemaining = Math.max(1, Math.round(delivery.etaMinutes * (1 - progress)));
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
          {/* Rider dot */}
          {riderPos && (
            <Marker coordinate={riderPos} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.riderDot}>
                <Ionicons name="bicycle" size={14} color={colors.white} />
              </View>
            </Marker>
          )}
          {/* Destination pin */}
          <Marker coordinate={dest}>
            <Ionicons name="location" size={32} color={colors.green} />
          </Marker>
          {/* Route polyline */}
          {riderPos && (
            <Polyline
              coordinates={[riderPos, dest]}
              strokeColor={colors.gold}
              strokeWidth={3}
              lineDashPattern={[6, 3]}
            />
          )}
        </MapView>

        {/* ETA overlay on map */}
        <View style={styles.etaOverlay} pointerEvents="none">
          <Text style={styles.etaNum}>{etaRemaining} min</Text>
          <Text style={styles.etaDist}>{distanceKm} km away</Text>
        </View>

        {/* Status badge on map */}
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]} pointerEvents="none">
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>

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
          {/* ℹ️ parcel info button */}
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

        {/* Rider row — only shown when a rider is assigned */}
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
              {/* Parcel name */}
              <Text style={tooltipStyles.parcelName}>{delivery.parcelName}</Text>

              {/* Seller */}
              <View style={tooltipStyles.row}>
                <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
                <Text style={tooltipStyles.detail}>from {delivery.sellerName}</Text>
              </View>

              {/* Location */}
              <View style={tooltipStyles.row}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={tooltipStyles.detail}>{delivery.sellerLocation}</Text>
              </View>

              {/* Size */}
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

  // Fit map to show both rider and destination when it opens
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
          {/* Animated rider dot in gold */}
          {riderPos && (
            <Marker coordinate={riderPos} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={fsStyles.riderDot}>
                <Ionicons name="bicycle" size={18} color={colors.dark} />
              </View>
            </Marker>
          )}

          {/* Destination pin in green */}
          <Marker coordinate={dest} title={delivery.address.label}>
            <View style={fsStyles.destPin}>
              <Ionicons name="location" size={44} color={colors.green} />
            </View>
          </Marker>

          {/* Route polyline */}
          {riderPos && (
            <Polyline
              coordinates={[riderPos, dest]}
              strokeColor={colors.gold}
              strokeWidth={4}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* ── Back button (top left) ── */}
        <TouchableOpacity
          style={[fsStyles.backBtn, { top: insets.top + 14 }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
          <Text style={fsStyles.backBtnText}>Back to Tracking</Text>
        </TouchableOpacity>

        {/* ── Floating info card (top — below back button) ── */}
        <View style={[fsStyles.infoCard, { top: insets.top + 66 }]}>
          {/* ETA + distance */}
          <View style={fsStyles.infoCardEtaRow}>
            <View>
              <Text style={fsStyles.infoCardEta}>{etaRemaining} min</Text>
              <Text style={fsStyles.infoCardDist}>{distanceKm} km away</Text>
            </View>
            <View style={[fsStyles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[fsStyles.statusPillText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>

          {/* Rider info + call — hidden until a rider is assigned */}
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
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={[fsStyles.riderVehicle, { color: colors.textMuted, fontStyle: 'italic' }]}>
                Awaiting rider assignment
              </Text>
            </View>
          )}
        </View>

        {/* ── Destination label (bottom) ── */}
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
  seedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${colors.gold}15`,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: `${colors.gold}35`,
  },
  seedBtnText: { fontSize: 11, fontWeight: '700', color: colors.gold },

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
  miniMapContainer: {
    height: MINI_MAP_HEIGHT,
    position: 'relative',
  },
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
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
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
  infoBtn: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
  },
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

  // Empty state
  emptyState: {
    alignItems: 'center', paddingHorizontal: 32, paddingTop: 64, gap: 16,
  },
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
  parcelName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gold,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detail: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.darkBorder,
    marginVertical: 4,
  },
  dismiss: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

// ── Fullscreen map styles ─────────────────────────────────────────────
const fsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: `${colors.gold}50`,
    zIndex: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  infoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10,10,10,0.90)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: `${colors.gold}35`,
    zIndex: 10,
  },
  infoCardEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardEta: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.gold,
    lineHeight: 30,
  },
  infoCardDist: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  riderVehicle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  riderDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  destPin: {
    alignItems: 'center',
  },
  destCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(10,10,10,0.90)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${colors.green}40`,
    zIndex: 10,
  },
  destCode: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.green,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  destLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
