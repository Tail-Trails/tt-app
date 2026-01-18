import React from 'react';
import { Text as RNText, StyleSheet, Platform, TextProps } from 'react-native';

console.log('[init] components/ThemedText.tsx loaded');
import styles from './ThemedText.styles';

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

// styles imported from ThemedText.styles.ts

// Named export only to avoid default-export initialization ordering issues
export { ThemedText };