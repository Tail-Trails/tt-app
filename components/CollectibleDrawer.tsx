import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import styles from './CollectibleDrawer.styles';

type Props = {
  visible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
};

export default function CollectibleDrawer({ visible, onClose, children, style, title }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const opacity = anim;

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.wrapper, { opacity }] as any}>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }, style as any]}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title || 'Collectible'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}
