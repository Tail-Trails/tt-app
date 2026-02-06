import React from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';

let LottieView: any = null;
try {
  // lottie-react-native is native-only; require it dynamically so web doesn't crash
  // (the package will be absent until the developer installs it)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LottieView = require('lottie-react-native').default;
} catch (e) {
  LottieView = null;
}

type Props = {
  size?: number;
};

export default function LottieLoader({ size = 200 }: Props) {
  // Fallback to ActivityIndicator on web or when lottie isn't installed/available
  if (Platform.OS === 'web' || !LottieView) {
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
