import { Platform, TextStyle } from 'react-native';

// Helper to handle the Android quirks automatically
const createTextStyle = (
  size: number, 
  weight: '400' | '500' | '600' | '700' | 'bold', 
  color: string
): TextStyle => ({
  fontSize: size,
  color: color,
  ...Platform.select({
    android: {
      // Android Fixes: aggressive padding and system defaults for stability
      includeFontPadding: true, 
      fontWeight: (weight === '600' || weight === '700' || weight === 'bold') ? 'bold' : 'normal',
      paddingHorizontal: 6,
      paddingVertical: 3,
      // No fixed lineHeight on Android to allow system to expand bounding box
      lineHeight: undefined, 
      textAlignVertical: 'center',
    },
    ios: {
      fontWeight: weight as any,
      lineHeight: Math.round(size * 1.3),
    },
  }),
});

export const Typography = {
  h1: (color: string) => createTextStyle(32, '700', color),
  h2: (color: string) => createTextStyle(24, '700', color),
  body: (color: string) => createTextStyle(16, '400', color),
  label: (color: string) => createTextStyle(14, '600', color),
  button: (color: string) => createTextStyle(16, '600', color),
  caption: (color: string) => createTextStyle(12, '400', color),
};