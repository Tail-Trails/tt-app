import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components';
import { Image } from 'expo-image';
import styles from './collectible.styles';
import { useRouter } from 'expo-router';
import { useAccount } from '@/context/AccountContext';
import CollectibleModal from './collectible-modal';

type Collectible = {
  name: string;
  description?: string;
  preview_url?: string;
  image_url?: string;
};

export default function CollectibleScreen() {
  const { collectibles, collectibleSvgs } = useAccount();
  console.log("Collectibles:", collectibles);
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Collectibles</Text>
        <View style={styles.spacer} />
      </View>

      {/* Collectibles List */}
      <ScrollView contentContainerStyle={styles.content}>
        {collectibles.map((collectible, i) => (
          <TouchableOpacity
            key={`${collectible.name}-${i}`}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedIndex(i);
              router.push(`/collectible-detail?index=${i}`);
            }}
          >
            {collectible.preview_url ? (
              <Image
                source={{ uri: collectible.preview_url }}
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
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
      {/* Detail screen opened via router when tapping an item */}
    </View>
  );
}

