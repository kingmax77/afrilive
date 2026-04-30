import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddressContext } from '../context/AddressContext';
import { colors } from '../theme/colors';

export default function AddressListScreen({ navigation }) {
  const { addresses: rawAddresses, primaryId, deleteAddress, setPrimary, loading } = useContext(AddressContext);
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];
  const [settingPrimary, setSettingPrimary] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleSetPrimary = async (id) => {
    setSettingPrimary(id);
    try {
      await setPrimary(id);
    } finally {
      setSettingPrimary(null);
    }
  };

  const handleDelete = (address) => {
    Alert.alert(
      'Delete Address',
      `Delete "${address.label ?? address.code}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(address.id);
            try {
              await deleteAddress(address.id);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateAddress')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>

        {addresses.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySubtitle}>Tap "Add New Address" to create your first SmartAddress.</Text>
          </View>
        )}

        {addresses.map((address) => {
          const isPrimary = address.id === primaryId;
          const isDeleting = deletingId === address.id;
          const isSettingThis = settingPrimary === address.id;

          return (
            <TouchableOpacity
              key={address.id}
              style={[styles.card, isPrimary && styles.cardPrimary]}
              onPress={() => navigation.navigate('AddressDetail', { address })}
              onLongPress={() => handleDelete(address)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.codeRow}>
                  <View style={[styles.codeBadge, isPrimary && styles.codeBadgePrimary]}>
                    <Ionicons
                      name="location"
                      size={12}
                      color={isPrimary ? colors.dark : colors.gold}
                    />
                    <Text style={[styles.codeText, isPrimary && styles.codeTextPrimary]}>
                      {address.code ?? '—'}
                    </Text>
                  </View>
                  {isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={11} color={colors.gold} />
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(address)}
                  disabled={isDeleting}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {isDeleting
                    ? <ActivityIndicator size="small" color={colors.error} />
                    : <Ionicons name="trash-outline" size={18} color={colors.error} />}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>{address.label ?? 'Home'}</Text>
              {!!address.landmark && (
                <Text style={styles.landmark} numberOfLines={1}>
                  <Ionicons name="flag-outline" size={12} color={colors.textMuted} /> {address.landmark}
                </Text>
              )}
              {!!address.gateColor && (
                <Text style={styles.detail}>Gate: {address.gateColor}</Text>
              )}

              {!isPrimary && (
                <TouchableOpacity
                  style={styles.setPrimaryBtn}
                  onPress={() => handleSetPrimary(address.id)}
                  disabled={!!settingPrimary}
                  activeOpacity={0.75}
                >
                  {isSettingThis
                    ? <ActivityIndicator size="small" color={colors.gold} />
                    : (
                      <>
                        <Ionicons name="star-outline" size={14} color={colors.gold} />
                        <Text style={styles.setPrimaryText}>Set as Primary</Text>
                      </>
                    )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  centered: { flex: 1, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}60`,
    backgroundColor: colors.goldFaded,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.gold },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 16,
    gap: 6,
  },
  cardPrimary: { borderColor: `${colors.gold}50` },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.goldFaded, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  codeBadgePrimary: { backgroundColor: colors.gold },
  codeText: { fontSize: 13, fontWeight: '700', color: colors.gold },
  codeTextPrimary: { color: colors.dark },
  primaryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: `${colors.gold}20`,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  label: { fontSize: 16, fontWeight: '700', color: colors.white },
  landmark: { fontSize: 13, color: colors.textMuted },
  detail: { fontSize: 13, color: colors.textMuted },
  setPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: `${colors.gold}50`,
    backgroundColor: colors.goldFaded,
  },
  setPrimaryText: { fontSize: 12, fontWeight: '600', color: colors.gold },
});
