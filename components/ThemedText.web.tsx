import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';

console.log('[init] components/ThemedText.web.tsx loaded');

const ThemedText: React.FC<TextProps> = (props) => {
  const { style, children, ...otherProps } = props;
  return (
    <RNText {...otherProps} style={[styles.default, style]}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  default: {
    // minimal default styles for web
  },
});

export { ThemedText };
