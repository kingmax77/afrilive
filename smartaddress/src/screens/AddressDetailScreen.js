import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Share,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AddressContext } from '../context/AddressContext';
import ShareModal from '../components/ShareModal';
import DeliveryConfidenceScore from '../components/DeliveryConfidenceScore';
import { colors } from '../theme/colors';
import { formatCoords, buildShareMessage } from '../utils/addressGenerator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 200;

const GATE_COLORS = {
  Black: '#1A1A1A', White: '#F5F5F5', Blue: '#2563EB', Red: '#DC2626',
  Green: '#16A34A', Brown: '#92400E', Yellow: '#D97706', Gray: '#6B7280', Orange: '#EA580C',
};

export default function AddressDetailScreen({ route, navigation }) {
  const { addressId } = route.params;
  const { addresses, deleteAddress } = useContext(AddressContext);
  const [shareVisible, setShareVisible] = useState(false);

  const address = addresses?.find((a) => a.id === addressId) ?? null;

  if (!address) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>Address not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Text style={{ color: colors.gold, fontSize: 15, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const createdDate = new Date(address.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const gateHex = address.gateColor ? GATE_COLORS[address.gateColor] ?? '#888' : null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address.code);
    Alert.alert('Copied!', `${address.code} copied to clipboard.`);
  };

  const handleShareWhatsApp = () => {
    const msg = buildShareMessage(address);
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then((ok) => {
      ok ? Linking.openURL(url) : handleShareOther();
    });
  };

  const handleShareSMS = () => {
    const msg = buildShareMessage(address);
    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(msg)}`,
      default: `sms:?body=${encodeURIComponent(msg)}`,
    });
    Linking.openURL(smsUrl).catch(handleShareOther);
  };

  const handleShareOther = async () => {
    const msg = buildShareMessage(address);
    try { await Share.share({ message: msg, title: `SmartAddress: ${address.code}` }); }
    catch (e) { console.warn(e); }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Address',
      `Delete ${address.label} (${address.code})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAddress(address.id);
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Map ── */}
        <View style={{ height: MAP_HEIGHT }}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            region={{
              latitude: address.latitude,
              longitude: address.longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            }}
            mapType="satellite"
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            <Marker coordinate={{ latitude: address.latitude, longitude: address.longitude }}>
              <Ionicons name="location" size={42} color={colors.gold} />
            </Marker>
          </MapView>
        </View>

        {/* ── Code Hero ── */}
        <View style={styles.codeHero}>
          <Text style={styles.codeHeroLabel}>SMARTADDRESS CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{address.code}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.codeCopyBtn}>
              <Ionicons name="copy-outline" size={20} color={colors.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeLabel}>{address.label}</Text>
          <Text style={styles.codeDate}>Created {createdDate}</Text>
        </View>

        {/* ── Delivery Confidence ── */}
        <View style={styles.card}>
          <DeliveryConfidenceScore address={address} />
        </View>

        {/* ── Gate & Entrance Photos ── */}
        {Array.isArray(address.photos) && address.photos.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>GATE & ENTRANCE PHOTOS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
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
        ) : (
          <TouchableOpacity
            style={styles.addPhotosPrompt}
            onPress={() => {/* future: edit screen */}}
          >
            <Ionicons name="camera-outline" size={18} color={colors.gold} />
            <Text style={styles.addPhotosText}>Add gate & entrance photos to boost confidence score</Text>
          </TouchableOpacity>
        )}

        {/* ── Arrival Instructions ── */}
        {address.arrivalInstructions ? (
          <View style={[styles.card, styles.arrivalCard]}>
            <View style={styles.arrivalHeader}>
              <Ionicons name="navigate-circle" size={18} color={colors.gold} />
              <Text style={styles.arrivalTitle}>LAST 50 METERS GUIDE</Text>
            </View>
            <Text style={styles.arrivalText}>{address.arrivalInstructions}</Text>
          </View>
        ) : null}

        {/* ── Address Details ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ADDRESS DETAILS</Text>
          <View style={styles.detailGrid}>
            {address.landmark ? (
              <DetailItem icon="navigate-outline" label="Landmark" value={address.landmark} fullWidth />
            ) : null}
            {address.gateColor ? (
              <DetailItem icon="keypad-outline" label="Gate / Door" value={`${address.gateColor} gate`} accent={gateHex} />
            ) : null}
            {address.floor ? (
              <DetailItem icon="business-outline" label="Floor / Apt" value={address.floor} />
            ) : null}
            <DetailItem icon="location-outline" label="Coordinates" value={formatCoords(address.latitude, address.longitude)} mono />
            {address.deliveryNotes ? (
              <DetailItem icon="document-text-outline" label="Delivery Notes" value={address.deliveryNotes} fullWidth />
            ) : null}
          </View>
        </View>

        {/* ── Delivery View (SharedAddress) ── */}
        <TouchableOpacity
          style={styles.deliveryViewBtn}
          onPress={() => navigation.navigate('SharedAddress', { addressId: address.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color={colors.green} />
          <Text style={styles.deliveryViewText}>Preview Rider's Delivery View</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.green} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* ── QR Code ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR CODE</Text>
          <Text style={styles.qrSubtitle}>
            Riders can scan this to pull up your full address instantly.
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={`smartaddress://${address.code}`}
              size={160}
              color={colors.dark}
              backgroundColor={colors.white}
            />
          </View>
          <Text style={styles.qrCode}>{address.code}</Text>
        </View>

        {/* ── Share Actions ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SHARE ADDRESS</Text>
          <View style={styles.shareGrid}>
            <ShareBtn icon="copy-outline" label="Copy Code" bg={colors.goldFaded} iconColor={colors.gold} borderColor={`${colors.gold}30`} onPress={handleCopy} />
            <ShareBtn icon="logo-whatsapp" label="WhatsApp" bg="#075E5420" iconColor="#25D366" borderColor="#25D36630" onPress={handleShareWhatsApp} />
            <ShareBtn icon="chatbubble-outline" label="SMS" bg={colors.greenFaded} iconColor={colors.green} borderColor={`${colors.green}30`} onPress={handleShareSMS} />
            <ShareBtn icon="share-social-outline" label="More" bg={colors.darkCard} iconColor={colors.textSecondary} borderColor={colors.darkBorder} onPress={handleShareOther} />
          </View>
        </View>

        {/* ── Delete ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.75}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.deleteBtnText}>Delete This Address</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ShareModal visible={shareVisible} onClose={() => setShareVisible(false)} address={address} />
    </>
  );
}

function DetailItem({ icon, label, value, accent, mono, fullWidth = false }) {
  return (
    <View style={[diStyles.item, fullWidth && diStyles.fullWidth]}>
      <View style={diStyles.iconBox}>
        <Ionicons name={icon} size={14} color={colors.gold} />
      </View>
      <View style={diStyles.textBox}>
        <Text style={diStyles.label}>{label}</Text>
        <View style={diStyles.valRow}>
          {accent && <View style={[diStyles.colorDot, { backgroundColor: accent }]} />}
          <Text style={[diStyles.value, mono && diStyles.mono]}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

function ShareBtn({ icon, label, bg, iconColor, borderColor, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.shareBtn, { backgroundColor: bg, borderColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.shareBtnText, { color: iconColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const diStyles = StyleSheet.create({
  item: { width: '48%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  fullWidth: { width: '100%' },
  iconBox: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: colors.goldFaded,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  textBox: { flex: 1 },
  label: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  valRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  value: { fontSize: 13, color: colors.white, fontWeight: '500', flex: 1, lineHeight: 18 },
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

  // Hero
  codeHero: {
    backgroundColor: colors.darkSurface, paddingHorizontal: 24, paddingVertical: 22,
    alignItems: 'center', borderBottomWidth: 1, borderColor: colors.darkBorder,
  },
  codeHeroLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, marginBottom: 8,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  codeText: {
    fontSize: 38, fontWeight: '900', color: colors.gold,
    letterSpacing: 3, fontFamily: 'monospace',
  },
  codeCopyBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.goldFaded, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${colors.gold}30`,
  },
  codeLabel: { fontSize: 17, fontWeight: '700', color: colors.white, marginBottom: 4 },
  codeDate: { fontSize: 12, color: colors.textMuted },

  // Cards
  card: {
    backgroundColor: colors.darkCard, marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.darkBorder,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  // Photos
  photosRow: { gap: 10, paddingVertical: 4 },
  photo: {
    width: SCREEN_WIDTH * 0.52,
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.darkBorder,
  },
  addPhotosPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.goldFaded, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: `${colors.gold}30`,
  },
  addPhotosText: { fontSize: 13, color: colors.gold, fontWeight: '500', flex: 1 },

  // Arrival
  arrivalCard: { borderColor: `${colors.gold}40`, backgroundColor: `${colors.gold}08` },
  arrivalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  arrivalTitle: { fontSize: 11, fontWeight: '700', color: colors.gold, letterSpacing: 1.5 },
  arrivalText: { fontSize: 14, color: colors.white, lineHeight: 21, fontWeight: '500' },

  // Delivery view button
  deliveryViewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.greenFaded, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: `${colors.green}30`,
  },
  deliveryViewText: { fontSize: 13, fontWeight: '600', color: colors.green },

  // QR
  qrSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 18, lineHeight: 18 },
  qrWrapper: {
    alignSelf: 'center', backgroundColor: colors.white,
    padding: 14, borderRadius: 14, marginBottom: 12,
  },
  qrCode: {
    textAlign: 'center', fontSize: 13, fontWeight: '600',
    color: colors.textMuted, fontFamily: 'monospace', letterSpacing: 2,
  },

  // Share
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shareBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  shareBtnText: { fontSize: 13, fontWeight: '600' },

  // Delete
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 20, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}10`,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: colors.error },
});
