import React from 'react';
import { Text as RNText, StyleSheet, Platform, TextProps } from 'react-native';

const ThemedText: React.FC<TextProps> = (props) => {
  const { style, children, ...otherProps } = props;

  return (
    <RNText
      {...otherProps}
      style={[styles.default, style]}
    >
      {children}
    </RNText>
  );
};

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

// Named + default exports for compatibility
export { ThemedText };
export default ThemedText;