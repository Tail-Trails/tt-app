import React from 'react';
import { Text, StyleSheet, Platform, TextProps } from 'react-native';

export function ThemedText(props: TextProps) {
  const { style, children, ...otherProps } = props;

  return (
    <Text
      // 1. Force one line where needed or use simple strategy
      textBreakStrategy="simple"
      // 2. The Android "breathing room" fix
      {...otherProps}
      style={[
        styles.default,
        style,
        Platform.OS === 'android' ? styles.androidFix : null,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    // Put any default font styles here (like color or family)
  },
  androidFix: {
    // This solves the "Profil" clipping
    paddingRight: 2,
    // Resetting font padding prevents vertical clipping
    includeFontPadding: false,
  },
});