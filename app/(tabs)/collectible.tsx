import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from '@/components';
import styles from './collectible.styles';
import { useRouter } from 'expo-router';
import { useAccount } from '@/context/AccountContext';

type Collectible = {
  name: string;
  description?: string;
  image_url?: string;
};

export default function CollectibleScreen() {
  const { collectibles, collectibleSvgs } = useAccount();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Collectibles</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {collectibles.map((collectible, i) => (
          <TouchableOpacity key={`${collectible.name}-${i}`} style={styles.item} activeOpacity={0.85}>
            {collectibleSvgs[i] ? (
              <SvgXml xml={collectibleSvgs[i] || ''} width={56} height={56} />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{collectible.name}</Text>
              <Text style={styles.itemDesc}>{collectible.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

