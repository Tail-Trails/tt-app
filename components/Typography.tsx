import React from 'react';
import { 
  Text as RNText, 
  TextProps, 
  Platform, 
  StyleSheet, 
  TextStyle 
} from 'react-native';

interface CustomTextProps extends TextProps {
  // You can add custom props here later, like 'variant' or 'color'
  children?: React.ReactNode;
}

const Typography: React.FC<CustomTextProps> = ({ style, children, ...props }) => {
  return (
    <RNText 
      {...props} 
      style={[styles.defaultStyle, style]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  defaultStyle: {
    ...Platform.select({
      android: {
        // More aggressive fix for Android clipping
        includeFontPadding: true,
        paddingHorizontal: 6, // Wider horizontal safety
        paddingVertical: 3,   // Taller vertical safety
        textAlignVertical: 'center',
        overflow: 'visible',  // Ensure bounds don't clip drawing
      },
      ios: {
        // iOS rendering is generally precise out of the box
      },
    }) as TextStyle,
  },
});

export default Typography;