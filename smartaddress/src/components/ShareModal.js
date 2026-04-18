import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import { buildShareMessage } from '../utils/addressGenerator';

const SHARE_OPTIONS = [
  {
    id: 'copy',
    icon: 'copy-outline',
    label: 'Copy Code',
    sublabel: 'Copy address code to clipboard',
    bg: colors.darkCard,
    iconColor: colors.gold,
  },
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp',
    label: 'Share via WhatsApp',
    sublabel: 'Send to a contact or group',
    bg: '#075E54',
    iconColor: '#25D366',
  },
  {
    id: 'sms',
    icon: 'chatbubble-outline',
    label: 'Share via SMS',
    sublabel: 'Send as a text message',
    bg: colors.green,
    iconColor: colors.white,
  },
  {
    id: 'other',
    icon: 'share-social-outline',
    label: 'More Options',
    sublabel: 'Share to other apps',
    bg: colors.darkCard,
    iconColor: colors.textSecondary,
  },
];

export default function ShareModal({ visible, onClose, address }) {
  if (!address) return null;

  const message = buildShareMessage(address);

  const handleOption = async (id) => {
    switch (id) {
      case 'copy': {
        await Clipboard.setStringAsync(address.code);
        Alert.alert('Copied!', `${address.code} copied to clipboard`);
        onClose();
        break;
      }
      case 'whatsapp': {
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to use this option.');
        }
        onClose();
        break;
      }
      case 'sms': {
        const smsUrl = Platform.select({
          ios: `sms:&body=${encodeURIComponent(message)}`,
          default: `sms:?body=${encodeURIComponent(message)}`,
        });
        await Linking.openURL(smsUrl).catch(() =>
          Alert.alert('Error', 'Could not open SMS app.')
        );
        onClose();
        break;
      }
      case 'other': {
        try {
          await Share.share({ message, title: `SmartAddress: ${address.code}` });
        } catch (e) {
          console.warn(e);
        }
        onClose();
        break;
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Share Address</Text>
            <Text style={styles.sheetCode}>{address.code}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        {SHARE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.optionRow}
            onPress={() => handleOption(opt.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={22} color={opt.iconColor} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <View style={styles.bottomPad} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: colors.darkBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.darkBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sheetCode: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: colors.darkBorder,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  optionSublabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  bottomPad: {
    height: 32,
  },
});
