import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import theme from '@/constants/colors';
import { Text } from '@/components';
import { API_URL } from '@/lib/api';
import styles from './collectible.styles';
import { useRouter } from 'expo-router';

type Collectible = {
  id: string;
  title: string;
  description?: string;
};

const SAMPLE: Collectible[] = [
  { id: '1', title: 'Trail Badge: Mountain', description: 'Earned for completing Mountain Trail' },
  { id: '2', title: 'Trail Badge: River', description: 'Earned for completing River Trail' },
  { id: '3', title: 'Trail Badge: Sunset', description: 'Earned for a golden-hour hike' },
];

const collectibleUrls = [
  `${API_URL}/uploads/proxy/collectibles/bone.svg`,
  `${API_URL}/uploads/proxy/collectibles/bowl.svg`,
  `${API_URL}/uploads/proxy/collectibles/sign.svg`,
];

export default function CollectibleScreen() {
  const [collectibleSvgs, setCollectibleSvgs] = React.useState<(string | null)[]>([null, null, null]);
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const results: (string | null)[] = [null, null, null];
      await Promise.all(collectibleUrls.map(async (u, i) => {
        try {
          const r = await fetch(u);
          if (!r.ok) return;
          const t = await r.text();
          results[i] = t;
        } catch (err) {
          // ignore
        }
      }));
      if (mounted) setCollectibleSvgs(results);
    })();
    return () => { mounted = false; };
  }, []);

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
        {SAMPLE.map((c, i) => (
          <TouchableOpacity key={c.id} style={styles.item} activeOpacity={0.85}>
            {collectibleSvgs[i] ? (
              <SvgXml xml={collectibleSvgs[i] || ''} width={56} height={56} />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{c.title}</Text>
              <Text style={styles.itemDesc}>{c.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

