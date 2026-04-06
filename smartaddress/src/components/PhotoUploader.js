import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const MAX_PHOTOS = 6;

export default function PhotoUploader({ photos = [], onChange, label = 'Gate & Entrance Photos' }) {
  const handleAdd = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow access to your photos to upload gate and entrance images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_PHOTOS - photos.length,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      onChange([...photos, ...newUris].slice(0, MAX_PHOTOS));
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      onChange([...photos, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const handleRemove = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: handleCamera },
      { text: 'Photo Library', onPress: handleAdd },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>{photos.length}/{MAX_PHOTOS}</Text>
      </View>
      <Text style={styles.hint}>
        Photos of your gate, entrance and door help riders find you instantly
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Existing photos */}
        {photos.map((uri, index) => (
          <View key={uri} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.thumbImage} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(index)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add button */}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddOptions}
            activeOpacity={0.75}
          >
            <Ionicons name="camera-outline" size={26} color={colors.gold} />
            <Text style={styles.addBtnText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  counter: {
    fontSize: 12,
    color: colors.textMuted,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    lineHeight: 17,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'visible',
    position: 'relative',
  },
  thumbImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  addBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldFaded,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.goldDark,
  },
});
