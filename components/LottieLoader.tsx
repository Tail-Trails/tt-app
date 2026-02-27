import React from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import theme from '@/constants/colors';

type Props = {
  size?: number;
};

export default function LottieLoader({ size = 200 }: Props) {
  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <LottieView
        source={require('../assets/tail-trails-loader.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
        // 🛡️ Critical for New Arch Stability:
        // 'HARDWARE' prevents "drawing too large" errors on older Androids
        renderMode="HARDWARE" 
        // Ensures the view doesn't render a black box if the first frame lags
        cacheComposition={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundPrimary,
  },
});