import { Platform } from 'react-native';

export const fonts = {
  // React Native uses system fonts by default
  // On Android: Roboto | On iOS: SF Pro
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 38,
  '5xl': 48,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
