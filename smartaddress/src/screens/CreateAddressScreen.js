import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import PhotoUploader from '../components/PhotoUploader';
import { colors } from '../theme/colors';
import {
  generateAddressCode,
  generateAddressId,
  formatCoords,
} from '../utils/addressGenerator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4;

const GATE_COLORS = [
  { label: 'Black',  hex: '#1A1A1A' },
  { label: 'White',  hex: '#F5F5F5' },
  { label: 'Blue',   hex: '#2563EB' },
  { label: 'Red',    hex: '#DC2626' },
  { label: 'Green',  hex: '#16A34A' },
  { label: 'Brown',  hex: '#92400E' },
  { label: 'Yellow', hex: '#D97706' },
  { label: 'Gray',   hex: '#6B7280' },
  { label: 'Orange', hex: '#EA580C' },
];

const DEFAULT_REGION = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function CreateAddressScreen({ navigation }) {
  const { addAddress } = useContext(AddressContext);
  const mapRef = useRef(null);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [pinCoords, setPinCoords] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [locating, setLocating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [landmark, setLandmark] = useState('');
  const [gateColor, setGateColor] = useState('');
  const [floor, setFloor] = useState('');
  const [arrivalInstructions, setArrivalInstructions] = useState('');
  const [photos, setPhotos] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location access in Settings to use your current location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setPinCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      mapRef.current?.animateToRegion(newRegion, 600);
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const handleRegionChangeComplete = (newRegion) => {
    setPinCoords({ latitude: newRegion.latitude, longitude: newRegion.longitude });
    setRegion(newRegion);
  };

  const handleGenerate = async () => {
    if (!label.trim()) {
      Alert.alert('Required', 'Please add an address label (e.g. "Home" or "Office").');
      return;
    }
    if (!landmark.trim()) {
      Alert.alert('Required', 'Please add a nearby landmark to help riders find you.');
      return;
    }
    if (!gateColor) {
      Alert.alert('Required', 'Please select your gate or door color.');
      return;
    }

    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const newAddress = {
        id: generateAddressId(),
        code: generateAddressCode(),
        label: label.trim(),
        landmark: landmark.trim(),
        gateColor,
        floor: floor.trim(),
        arrivalInstructions: arrivalInstructions.trim(),
        photos,
        deliveryNotes: deliveryNotes.trim(),
        latitude: pinCoords.latitude,
        longitude: pinCoords.longitude,
        createdAt: new Date().toISOString(),
      };
      await addAddress(newAddress);
      navigation.navigate('AddressDetail', { addressId: newAddress.id });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate address. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gold} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Create Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Map ── */}
        <View style={{ height: MAP_HEIGHT }}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={DEFAULT_REGION}
            onRegionChangeComplete={handleRegionChangeComplete}
            mapType="satellite"
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
          />

          {/* Fixed center pin — user pans map under it */}
          <View style={styles.centerPinWrap} pointerEvents="none">
            <Ionicons name="location" size={46} color={colors.gold} style={styles.centerPinIcon} />
            <View style={styles.centerPinShadow} />
          </View>

          {/* Coords badge */}
          <View style={styles.coordsBadge} pointerEvents="none">
            <Ionicons name="navigate" size={12} color={colors.gold} />
            <Text style={styles.coordsText}>
              {formatCoords(pinCoords.latitude, pinCoords.longitude)}
            </Text>
          </View>

          {/* My Location FAB */}
          <TouchableOpacity
            style={styles.locationFab}
            onPress={handleUseMyLocation}
            disabled={locating}
            activeOpacity={0.85}
          >
            {locating
              ? <ActivityIndicator size="small" color={colors.dark} />
              : <Ionicons name="locate" size={22} color={colors.dark} />
            }
          </TouchableOpacity>

          {/* Drag hint */}
          <View style={styles.mapHint} pointerEvents="none">
            <Text style={styles.mapHintText}>Drag the map · pin stays centred</Text>
          </View>
        </View>

        {/* ── Form ── */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Address Label */}
          <Field label="Address Label" required>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kingsley Home, Main Office"
              placeholderTextColor={colors.textMuted}
              value={label}
              onChangeText={setLabel}
              maxLength={40}
            />
          </Field>

          {/* Landmark */}
          <Field label="Nearby Landmark" required>
            <TextInput
              style={styles.input}
              placeholder="e.g. Opposite Shell petrol station, Lekki"
              placeholderTextColor={colors.textMuted}
              value={landmark}
              onChangeText={setLandmark}
              maxLength={100}
            />
          </Field>

          {/* Gate Color */}
          <Field label="Gate / Door Color" required>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {GATE_COLORS.map((c) => {
                const sel = gateColor === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    style={[styles.colorOption, sel && styles.colorOptionSelected]}
                    onPress={() => setGateColor(c.label)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />
                    <Text style={[styles.colorLabel, sel && styles.colorLabelSel]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Field>

          {/* Floor / Apartment */}
          <Field label="Floor / Apartment">
            <TextInput
              style={styles.input}
              placeholder="e.g. 3rd Floor, Apt 7B"
              placeholderTextColor={colors.textMuted}
              value={floor}
              onChangeText={setFloor}
              maxLength={50}
            />
          </Field>

          {/* Arrival Instructions */}
          <Field label="Last 50 Meters Guide" hint="Tell riders exactly what to do when they get close">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="e.g. Enter blue gate on right side of Shell. Take stairs, NOT lift. Door 7B is second on left."
              placeholderTextColor={colors.textMuted}
              value={arrivalInstructions}
              onChangeText={setArrivalInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{arrivalInstructions.length}/300</Text>
          </Field>

          {/* Photos */}
          <View style={styles.fieldGroup}>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </View>

          {/* Delivery Notes */}
          <Field label="Delivery Notes">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="e.g. Call on arrival. Dog in compound, stays in back."
              placeholderTextColor={colors.textMuted}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
          </Field>

          {/* Generate */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating
              ? <ActivityIndicator size="small" color={colors.dark} />
              : <Ionicons name="flash" size={22} color={colors.dark} />
            }
            <Text style={styles.generateBtnText}>
              {generating ? 'Generating...' : 'Generate My Address Code'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>
            Your unique code and details are stored securely on this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkSurface },
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.darkSurface,
    borderBottomWidth: 1, borderColor: colors.darkBorder,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  pageTitle: { fontSize: 17, fontWeight: '700', color: colors.white },

  // Map
  centerPinWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  centerPinIcon: { marginBottom: 24 },
  centerPinShadow: {
    position: 'absolute', bottom: '50%',
    width: 12, height: 6, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)', transform: [{ scaleX: 1.5 }],
  },
  coordsBadge: {
    position: 'absolute', bottom: 44, alignSelf: 'center',
    backgroundColor: 'rgba(10,10,10,0.75)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  coordsText: { fontSize: 12, color: colors.white, fontFamily: 'monospace' },
  locationFab: {
    position: 'absolute', top: 14, right: 14,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  mapHint: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    backgroundColor: 'rgba(10,10,10,0.5)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  mapHintText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  // Form
  formScroll: { flex: 1, backgroundColor: colors.offWhite },
  formContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.dark },
  fieldHint: { fontSize: 12, color: '#888', lineHeight: 16 },
  required: { color: colors.gold },
  input: {
    backgroundColor: colors.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.dark,
    borderWidth: 1.5, borderColor: colors.border,
  },
  textarea: { minHeight: 90, paddingTop: 13 },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 2 },

  // Gate colors
  colorRow: { gap: 8, paddingVertical: 4 },
  colorOption: {
    alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.white, minWidth: 58,
  },
  colorOptionSelected: { borderColor: colors.gold, backgroundColor: colors.goldFaded },
  colorSwatch: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  colorLabel: { fontSize: 11, fontWeight: '500', color: '#666' },
  colorLabelSel: { color: colors.goldDark, fontWeight: '700' },

  // Generate
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 14, marginTop: 8,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  generateBtnText: { fontSize: 17, fontWeight: '700', color: colors.dark },
  footNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
