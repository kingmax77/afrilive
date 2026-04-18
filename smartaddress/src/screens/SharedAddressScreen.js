import React, { useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import DeliveryConfidenceScore from '../components/DeliveryConfidenceScore';
import { colors } from '../theme/colors';
import { formatCoords } from '../utils/addressGenerator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 280;

const GATE_COLORS = {
  Black: '#1A1A1A', White: '#F5F5F5', Blue: '#2563EB', Red: '#DC2626',
  Green: '#16A34A', Brown: '#92400E', Yellow: '#D97706', Gray: '#6B7280', Orange: '#EA580C',
};

export default function SharedAddressScreen({ route }) {
  const { addressId } = route.params;
  const { addresses } = useContext(AddressContext);
  const mapRef = useRef(null);

  const [routeCoords, setRouteCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const address = addresses?.find((a) => a.id === addressId) ?? null;

  if (!address) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>Address not found.</Text>
      </View>
    );
  }

  const destination = { latitude: address.latitude, longitude: address.longitude };

  const handleGetDirections = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location to get directions.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const origin = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(origin);

      // Draw polyline from origin to destination on the in-app map
      setRouteCoords([origin, destination]);

      // Fit the map to show both points with padding
      mapRef.current?.fitToCoordinates([origin, destination], {
        edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
        animated: true,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const handleCallRider = () => {
    Linking.openURL('tel:+254700000000');
  };

  const gateHex = address.gateColor ? GATE_COLORS[address.gateColor] ?? '#888' : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: address.latitude,
            longitude: address.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          mapType="satellite"
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Destination pin */}
          <Marker coordinate={destination} title={address.label} description={address.code}>
            <View style={styles.markerWrap}>
              <Ionicons name="location" size={44} color={colors.gold} />
            </View>
          </Marker>

          {/* Route polyline drawn in-app (no external navigation) */}
          {routeCoords && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={colors.gold}
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          )}
        </MapView>

        {/* Get Directions FAB */}
        <TouchableOpacity
          style={[styles.directionsFab, locating && { opacity: 0.7 }]}
          onPress={handleGetDirections}
          disabled={locating}
          activeOpacity={0.85}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.dark} />
          ) : (
            <Ionicons name="navigate" size={20} color={colors.dark} />
          )}
          <Text style={styles.directionsFabText}>
            {routeCoords ? 'Reroute' : 'Get Directions'}
          </Text>
        </TouchableOpacity>

        {routeCoords && (
          <View style={styles.routeActiveBadge} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            <Text style={styles.routeActiveText}>Route active · on-screen navigation</Text>
          </View>
        )}
      </View>

      {/* ── Code + Label ── */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>SMARTADDRESS</Text>
        <Text style={styles.heroCode}>{address.code}</Text>
        <Text style={styles.heroAddressLabel}>{address.label}</Text>
      </View>

      {/* ── Delivery Confidence ── */}
      <View style={styles.card}>
        <DeliveryConfidenceScore address={address} />
      </View>

      {/* ── Gate & Entrance Photos ── */}
      {Array.isArray(address.photos) && address.photos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GATE & ENTRANCE PHOTOS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosScroll}
          >
            {address.photos.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Arrival Instructions ── */}
      {address.arrivalInstructions ? (
        <View style={[styles.card, styles.arrivalCard]}>
          <View style={styles.arrivalHeader}>
            <Ionicons name="navigate-circle" size={20} color={colors.gold} />
            <Text style={styles.arrivalTitle}>LAST 50 METERS GUIDE</Text>
          </View>
          <Text style={styles.arrivalText}>{address.arrivalInstructions}</Text>
        </View>
      ) : null}

      {/* ── Address Details ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>LOCATION DETAILS</Text>
        <View style={styles.detailGrid}>
          {address.landmark ? (
            <DetailRow icon="navigate-outline" label="Landmark" value={address.landmark} />
          ) : null}
          {address.gateColor ? (
            <DetailRow
              icon="keypad-outline"
              label="Gate Color"
              value={address.gateColor}
              accent={gateHex}
            />
          ) : null}
          {address.floor ? (
            <DetailRow icon="business-outline" label="Floor / Apt" value={address.floor} />
          ) : null}
          <DetailRow
            icon="location-outline"
            label="Coordinates"
            value={formatCoords(address.latitude, address.longitude)}
            mono
          />
          {address.deliveryNotes ? (
            <DetailRow icon="document-text-outline" label="Delivery Notes" value={address.deliveryNotes} fullWidth />
          ) : null}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, accent, mono, fullWidth }) {
  return (
    <View style={[drStyles.row, fullWidth && drStyles.fullWidth]}>
      <View style={drStyles.iconBox}>
        <Ionicons name={icon} size={14} color={colors.gold} />
      </View>
      <View style={drStyles.textBox}>
        <Text style={drStyles.label}>{label}</Text>
        <View style={drStyles.valueRow}>
          {accent && (
            <View style={[drStyles.colorDot, { backgroundColor: accent }]} />
          )}
          <Text style={[drStyles.value, mono && drStyles.mono]}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { width: '48%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  fullWidth: { width: '100%' },
  iconBox: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center',
  },
  textBox: { flex: 1 },
  label: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  value: { fontSize: 13, color: colors.white, fontWeight: '500', flex: 1 },
  mono: { fontFamily: 'monospace', fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  content: { paddingBottom: 20 },
  notFound: {
    flex: 1, backgroundColor: colors.dark,
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  notFoundText: { fontSize: 15, color: colors.textMuted },

  // Map
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  markerWrap: { alignItems: 'center' },
  directionsFab: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  directionsFabText: { fontSize: 14, fontWeight: '700', color: colors.dark },
  routeActiveBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,10,10,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeActiveText: { fontSize: 11, color: colors.white },

  // Hero
  heroSection: {
    backgroundColor: colors.darkSurface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.darkBorder,
  },
  heroLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, marginBottom: 6,
  },
  heroCode: {
    fontSize: 38, fontWeight: '900', color: colors.gold,
    letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6,
  },
  heroAddressLabel: { fontSize: 16, fontWeight: '600', color: colors.white },

  // Cards
  card: {
    backgroundColor: colors.darkCard,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  // Arrival
  arrivalCard: { borderColor: `${colors.gold}40`, backgroundColor: `${colors.gold}08` },
  arrivalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  arrivalTitle: {
    fontSize: 11, fontWeight: '700', color: colors.gold,
    letterSpacing: 1.5,
  },
  arrivalText: {
    fontSize: 15, color: colors.white, lineHeight: 22, fontWeight: '500',
  },

  // Photos
  photosScroll: { gap: 10, paddingVertical: 4 },
  photo: {
    width: SCREEN_WIDTH * 0.55,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.darkBorder,
  },
});
