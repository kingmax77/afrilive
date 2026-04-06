import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import DeliveryConfidenceScore from '../components/DeliveryConfidenceScore';
import { colors } from '../theme/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.6;

// ── Mock delivery assigned to the rider ──────────────────────────────
const MOCK_DELIVERY = {
  orderId: 'SA-LIVE-2847',
  customer: { name: 'Kingsley Obi', phone: '+234810000001' },
  address: {
    code: 'BXR-204-17',
    label: 'Kingsley Home',
    landmark: 'Opposite Shell petrol station, Lekki Phase 1',
    gateColor: 'Blue',
    floor: '3rd Floor, Apt 7B',
    arrivalInstructions:
      'Enter blue gate on the right side of Shell station. Take stairs, NOT lift — lift is broken. Door 7B is the second door on your left after the stairs.',
    photos: [], // Real app: server-hosted URIs
    deliveryNotes: 'Call on arrival. Dog in compound, stays in back.',
    latitude: -1.2921,
    longitude: 36.8219,
  },
  riderCurrentPosition: { latitude: -1.268, longitude: 36.838 },
  etaMinutes: 14,
};

const GATE_COLORS = {
  Black: '#1A1A1A', White: '#F5F5F5', Blue: '#2563EB', Red: '#DC2626',
  Green: '#16A34A', Brown: '#92400E', Yellow: '#D97706', Gray: '#6B7280', Orange: '#EA580C',
};

export default function DriverDeliveryScreen() {
  const { userName } = useContext(AuthContext);
  const mapRef = useRef(null);
  const [deliveryAssigned, setDeliveryAssigned] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [delivered, setDelivered] = useState(false);

  const handleIncomingDelivery = () => {
    Vibration.vibrate([0, 200, 100, 200]);
    setDelivery(MOCK_DELIVERY);
    setDeliveryAssigned(true);
    setDelivered(false);

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [MOCK_DELIVERY.riderCurrentPosition, {
          latitude: MOCK_DELIVERY.address.latitude,
          longitude: MOCK_DELIVERY.address.longitude,
        }],
        { edgePadding: { top: 60, right: 40, bottom: 80, left: 40 }, animated: true }
      );
    }, 500);
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Mark as Delivered?',
      `Confirm you have delivered parcel ${delivery?.orderId} to ${delivery?.customer.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: () => {
            setDelivered(true);
            setTimeout(() => {
              setDeliveryAssigned(false);
              setDelivery(null);
              setDelivered(false);
            }, 2500);
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (delivery?.customer.phone) {
      Linking.openURL(`tel:${delivery.customer.phone}`);
    }
  };

  // ── LOCKED SCREEN ─────────────────────────────────────────────────
  if (!deliveryAssigned) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.lockedScreen}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.lockedTitle}>No Active Delivery</Text>
          <Text style={styles.lockedSubtitle}>
            Hey {userName || 'Rider'}, this screen unlocks automatically when a delivery is assigned to you.
          </Text>

          <View style={styles.lockedStats}>
            {[
              { label: 'Today', value: '0 deliveries' },
              { label: 'Status', value: 'Available' },
            ].map((s, i) => (
              <View key={i} style={styles.lockedStat}>
                <Text style={styles.lockedStatVal}>{s.value}</Text>
                <Text style={styles.lockedStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Test button — simulates incoming delivery notification */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleIncomingDelivery}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications" size={18} color={colors.dark} />
            <Text style={styles.testBtnText}>Simulate Incoming Delivery</Text>
          </TouchableOpacity>
          <Text style={styles.testNote}>
            This button simulates a real-time dispatch notification from AfriLive.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────────
  if (delivered) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successScreen}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.green} />
          </View>
          <Text style={styles.successTitle}>Delivered!</Text>
          <Text style={styles.successSubtitle}>
            {delivery?.orderId} marked as delivered. Locking screen...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ACTIVE DELIVERY SCREEN ────────────────────────────────────────
  const dest = {
    latitude: delivery.address.latitude,
    longitude: delivery.address.longitude,
  };
  const gateHex = GATE_COLORS[delivery.address.gateColor] ?? '#888';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Map (60% screen) ── */}
        <View style={{ height: MAP_HEIGHT }}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: delivery.riderCurrentPosition.latitude,
              longitude: delivery.riderCurrentPosition.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            mapType="satellite"
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {/* Destination pin */}
            <Marker coordinate={dest} title={delivery.address.label}>
              <Ionicons name="location" size={44} color={colors.gold} />
            </Marker>

            {/* Route */}
            <Polyline
              coordinates={[delivery.riderCurrentPosition, dest]}
              strokeColor={colors.gold}
              strokeWidth={5}
              lineDashPattern={[0]}
            />
          </MapView>

          {/* Order ID badge */}
          <View style={styles.orderBadge} pointerEvents="none">
            <Text style={styles.orderBadgeText}>{delivery.orderId}</Text>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{delivery.etaMinutes} min ETA</Text>
            </View>
          </View>
        </View>

        {/* ── Customer + Call ── */}
        <View style={styles.customerBar}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person" size={18} color={colors.dark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{delivery.customer.name}</Text>
            <Text style={styles.customerPhone}>{delivery.customer.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callBigBtn} onPress={handleCall} activeOpacity={0.85}>
            <Ionicons name="call" size={22} color={colors.white} />
            <Text style={styles.callBigText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* ── Arrival Instructions (hero) ── */}
        <View style={styles.arrivalBlock}>
          <View style={styles.arrivalBlockHeader}>
            <Ionicons name="navigate-circle" size={22} color={colors.gold} />
            <Text style={styles.arrivalBlockTitle}>LAST 50 METERS GUIDE</Text>
          </View>
          <Text style={styles.arrivalBlockText}>{delivery.address.arrivalInstructions}</Text>

          {/* Gate color chip */}
          <View style={styles.gateChip}>
            <View style={[styles.gateDot, { backgroundColor: gateHex }]} />
            <Text style={styles.gateChipText}>{delivery.address.gateColor} Gate</Text>
          </View>
          {delivery.address.floor ? (
            <View style={[styles.gateChip, { marginLeft: 8 }]}>
              <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.gateChipText}>{delivery.address.floor}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Gate Photos ── */}
        {delivery.address.photos?.length > 0 ? (
          <View style={styles.photosSection}>
            <Text style={styles.sectionLabel}>GATE & ENTRANCE PHOTOS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {delivery.address.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.gatePhoto} />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.noPhotosNote}>
            <Ionicons name="images-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noPhotosText}>
              No gate photos uploaded by customer.
            </Text>
          </View>
        )}

        {/* ── Landmark ── */}
        <View style={styles.landmarkRow}>
          <Ionicons name="navigate-outline" size={16} color={colors.gold} />
          <Text style={styles.landmarkText}>{delivery.address.landmark}</Text>
        </View>

        {/* ── Delivery Confidence ── */}
        <View style={styles.confidenceCard}>
          <DeliveryConfidenceScore address={delivery.address} />
        </View>

        {/* ── Delivery Notes ── */}
        {delivery.address.deliveryNotes ? (
          <View style={styles.notesCard}>
            <Ionicons name="document-text-outline" size={15} color={colors.textMuted} />
            <Text style={styles.notesText}>{delivery.address.deliveryNotes}</Text>
          </View>
        ) : null}

        {/* ── Mark Delivered ── */}
        <TouchableOpacity
          style={styles.deliveredBtn}
          onPress={handleMarkDelivered}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={24} color={colors.dark} />
          <Text style={styles.deliveredBtnText}>Mark as Delivered</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },

  // Locked
  lockedScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  lockIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.darkCard,
    borderWidth: 1, borderColor: colors.darkBorder,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  lockedTitle: { fontSize: 22, fontWeight: '800', color: colors.white, textAlign: 'center' },
  lockedSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  lockedStats: { flexDirection: 'row', gap: 32, marginVertical: 8 },
  lockedStat: { alignItems: 'center', gap: 4 },
  lockedStatVal: { fontSize: 16, fontWeight: '700', color: colors.white },
  lockedStatLabel: { fontSize: 12, color: colors.textMuted },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.gold, paddingHorizontal: 22, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  testBtnText: { fontSize: 15, fontWeight: '700', color: colors.dark },
  testNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // Success
  successScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  successIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.greenFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: colors.white },
  successSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  // Map overlay
  orderBadge: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    gap: 6,
  },
  orderBadgeText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  etaBadge: {
    backgroundColor: colors.gold,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  etaText: { fontSize: 13, fontWeight: '800', color: colors.dark },

  // Customer bar
  customerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.darkCard, padding: 16,
    borderBottomWidth: 1, borderColor: colors.darkBorder,
  },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  customerName: { fontSize: 16, fontWeight: '700', color: colors.white },
  customerPhone: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  callBigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.green, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 12,
  },
  callBigText: { fontSize: 15, fontWeight: '700', color: colors.white },

  // Arrival block
  arrivalBlock: {
    backgroundColor: `${colors.gold}0D`,
    borderLeftWidth: 4, borderLeftColor: colors.gold,
    padding: 16, marginTop: 0,
  },
  arrivalBlockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  arrivalBlockTitle: {
    fontSize: 11, fontWeight: '700', color: colors.gold,
    letterSpacing: 1.5,
  },
  arrivalBlockText: {
    fontSize: 17, fontWeight: '700', color: colors.white,
    lineHeight: 25,
  },
  gateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.darkCard,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start', marginTop: 12, borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  gateDot: { width: 12, height: 12, borderRadius: 6 },
  gateChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  // Photos
  photosSection: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, marginBottom: 10,
  },
  gatePhoto: {
    width: SCREEN_WIDTH * 0.55, height: 160,
    borderRadius: 12, backgroundColor: colors.darkBorder,
  },
  noPhotosNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: colors.darkCard,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  noPhotosText: { fontSize: 13, color: colors.textMuted },

  // Landmark
  landmarkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginTop: 12,
  },
  landmarkText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  // Confidence
  confidenceCard: {
    backgroundColor: colors.darkCard, marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.darkBorder,
  },

  // Notes
  notesCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: colors.darkCard,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.darkBorder,
  },
  notesText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  // Delivered button
  deliveredBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.green, marginHorizontal: 16, marginTop: 20,
    paddingVertical: 18, borderRadius: 16,
    shadowColor: colors.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  deliveredBtnText: { fontSize: 18, fontWeight: '800', color: colors.white },
});
