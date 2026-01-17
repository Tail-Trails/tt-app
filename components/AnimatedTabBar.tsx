import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, Text, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';


console.log('[init] components/AnimatedTabBar.tsx loaded');

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Debug: log current navigation state to detect unexpected extra tabs
    console.log('AnimatedTabBar state.index:', state.index);
    console.log('AnimatedTabBar routes:', state.routes.map(r => ({ name: r.name, key: r.key })));
    console.log('AnimatedTabBar descriptors keys:', Object.keys(descriptors));

    state.routes.forEach((route, index) => {
      Animated.timing(animatedValues[index], {
        toValue: state.index === index ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [state.index, state.routes, animatedValues]);

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 20);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBar}>
        {/**
         * Render only routes that expose tab bar options (title/label/icon).
         * File-based routing sometimes injects extra routes; this guard
         * prevents rendering unexpected tabs while we diagnose the cause.
         */}
        {state.routes
          .filter(route => {
            const opts = descriptors[route.key]?.options;
            return !!(opts && (opts.tabBarLabel || opts.title || opts.tabBarIcon));
          })
          .map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const animatedValue = animatedValues[index];

          const containerWidth = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [44, 100],
          });

          const backgroundColor = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(40, 46, 16, 0.6)', 'rgba(40, 46, 16, 0.9)'],
          });

          const textOpacity = animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          const iconColor = isFocused ? '#FFFE77' : '#9ca3af';

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabButton,
                {
                  width: containerWidth,
                  backgroundColor,
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabTouchable}
              >
                <View style={styles.tabContent}>
                  <View style={styles.iconWrapper}>
                    {options.tabBarIcon && options.tabBarIcon({ 
                      focused: isFocused, 
                      color: iconColor, 
                      size: 22 
                    })}
                  </View>
                  <Animated.View style={{ opacity: textOpacity }}>
                    {isFocused && (
                      <Text style={styles.label}>{String(label)}</Text>
                    )}
                  </Animated.View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// named export only (avoid default-export TDZ issues)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 35, 13, 0.95)',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  tabButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 0,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFE77',
    fontSize: 13,
    fontWeight: '600',
  },
});
