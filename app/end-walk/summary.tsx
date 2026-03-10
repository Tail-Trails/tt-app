import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './summary.styles';
import { formatDuration } from '@/utils/distance';

export default function EndWalkSummary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  let draft: any = undefined;
  try {
    if (typeof params.draft === 'string') {
      draft = JSON.parse(decodeURIComponent(params.draft));
    }
  } catch (err) {
    console.warn('Failed to parse draft param in end-walk summary', err);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>

        <View style={styles.bigHeader}>
          <Text style={styles.hugeTitle}>Great walk today{draft && draft.name ? `\n${draft.name}!` : ' Username!'} 👏</Text>
          <Text style={styles.bigSubtitle}>{draft && draft.userName ? `${draft.userName}` : 'DogName'} enjoyed every step</Text>
        </View>

        <View style={styles.statsGridTop}>
          <View style={styles.statCard}><Text style={styles.statLabel}>TIME</Text><Text style={styles.statValue}>{draft && draft.duration ? formatDuration(draft.duration) : '0s'}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>DISTANCE</Text><Text style={styles.statValue}>{draft && draft.distance ? `${Math.round(draft.distance)}m` : '0m'}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>ELEVATION</Text><Text style={styles.statValue}>{draft && draft.maxElevation ? `${Math.round(draft.maxElevation)}m` : '0m'}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>SNIFF TIME</Text><Text style={styles.statValue}>0s</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>PACE</Text><Text style={styles.statValue}>{draft && draft.pace ? draft.pace : '0:00/km'}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>SPEED</Text><Text style={styles.statValue}>{draft && draft.speed ? `${(draft.speed).toFixed(1)}km/h` : '0.0km/h'}</Text></View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.bottomSheet} pointerEvents="box-none">
        <View style={styles.bottomContent}>
          <Text style={styles.bottomTitle}>How was the trail?</Text>
          <Text style={styles.bottomSubtitle}>Reviews help us make better suggestions</Text>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map((s) => (
              <TouchableOpacity key={s} style={styles.starButton} onPress={() => router.push(`/end-walk/review?draft=${encodeURIComponent(JSON.stringify(draft || {}))}&rating=${s}`)}>
                <Text style={styles.star}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );
}
