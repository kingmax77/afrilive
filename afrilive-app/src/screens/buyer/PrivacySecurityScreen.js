import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

const maskPhone = (phone) => {
  if (!phone) return '—';
  const str = String(phone);
  return str.slice(0, 4) + '••••••' + str.slice(-2);
};

export default function PrivacySecurityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUser } = useAuth();
  const [nameModal, setNameModal] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const handleSaveName = async () => {
    if (!nameInput.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    await updateUser({ name: nameInput.trim() });
    setNameModal(false);
    Alert.alert('Done', 'Display name updated.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Account Deletion', 'Please contact support@afrilive.com to complete account deletion.'),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => setNameModal(true)}>
              <View style={styles.rowIcon}>
                <Ionicons name="person-outline" size={20} color={COLORS.gold} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Display Name</Text>
                <Text style={styles.rowSub}>{user?.name || '—'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="call-outline" size={20} color={COLORS.gold} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Phone Number</Text>
                <Text style={styles.rowSub}>{maskPhone(user?.phone)}</Text>
              </View>
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyText}>Read only</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Block List</Text>
          <View style={styles.menuGroup}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="ban-outline" size={20} color={COLORS.gold} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Blocked Accounts</Text>
                <Text style={styles.rowSub}>No blocked accounts</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
              <View style={[styles.rowIcon, styles.rowIconDanger]}>
                <Ionicons name="trash-outline" size={20} color={COLORS.red} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: COLORS.red }]}>Delete Account</Text>
                <Text style={styles.rowSub}>Permanently remove your account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={nameModal} transparent animationType="slide" onRequestClose={() => setNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Change Display Name</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  scroll: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(232,160,32,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: 'rgba(192,57,43,0.12)' },
  rowContent: { flex: 1 },
  rowLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  readOnlyBadge: {
    backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 3,
  },
  readOnlyText: { color: COLORS.textMuted, fontSize: 11 },
  input: {
    backgroundColor: COLORS.dark, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, color: COLORS.white,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  modalSave: {
    flex: 1, borderRadius: 12, backgroundColor: COLORS.gold,
    paddingVertical: 12, alignItems: 'center',
  },
  modalSaveText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
});
