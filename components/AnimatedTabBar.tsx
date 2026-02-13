import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, Text, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import styles from './AnimatedTabBar.styles';
import theme from '@/constants/colors';


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

  // Put the safe-area padding on the tabBar itself so its background
  // extends to the bottom of the screen and there is no white gap.
  const tabBarPaddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { paddingBottom: tabBarPaddingBottom }]}>
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

          // Always render the tab with icon above and label below.
          // Keep a small animation for selection, but use a fixed button width so
          // labels remain visible across all tabs.
          const buttonWidth = 72;
          const backgroundColor = theme.backgroundPrimary; // No animation for background color, keep it consistent
          const textOpacity = 1; // labels are always visible now
          const iconColor = isFocused ? theme.accentPrimary : theme.textMuted;
          const textColor = isFocused ? theme.accentPrimary : theme.textMuted;

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabButton,
                {
                  width: buttonWidth,
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
                    <Text style={[styles.label, isFocused && styles.labelActive]}>{String(label)}</Text>
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
