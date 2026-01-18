import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import styles from './ThemedText.styles';

console.log('[init] components/ThemedText.web.tsx loaded');

const ThemedText: React.FC<TextProps> = (props) => {
  const { style, children, ...otherProps } = props;
  return (
    <RNText {...otherProps} style={[styles.default, style]}>
      {children}
    </RNText>
  );
};

// styles imported from ThemedText.styles.ts

export { ThemedText };
