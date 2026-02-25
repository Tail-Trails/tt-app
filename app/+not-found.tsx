import { Link, Stack } from "expo-router";
import React from 'react';
import { View, StyleSheet } from "react-native";
import { Text } from '@/components';
import { Typography } from '@/constants/typography';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" asChild style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    ...Typography.h2('#000'),
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    ...Typography.label('#2e78b7'),
  },
});
