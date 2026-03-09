import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import styles from './end-walk.styles';
import theme from '@/constants/colors';

const DESCRIPTIONS = ['Beach', 'Forest', 'Road', 'Cliff'];

export default function EndWalkReview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  let draft: any = undefined;
  let initialRating = 0;
  try {
    if (typeof params.draft === 'string') {
      draft = JSON.parse(decodeURIComponent(params.draft));
    }
    if (typeof params.rating === 'string') {
      initialRating = parseInt(params.rating, 10) || 0;
    }
  } catch (err) {
    console.warn('Failed to parse draft param in end-walk review', err);
  }

  const [rating, setRating] = useState<number>(initialRating);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // if rating came from params, prefill a selection (optional)
    if (initialRating) setRating(initialRating);
  }, [initialRating]);

  const toggleDescription = (idx: number) => {
    setSelected(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const goBack = () => {
    router.push(`/end-walk/summary?draft=${encodeURIComponent(JSON.stringify(draft || {}))}`);
  };

  const goNext = () => {
    const picked = DESCRIPTIONS.filter((_, i) => selected[i]);
    const enhanced = { ...draft, rating, tags: picked };
    router.push(`/end-walk/info?draft=${encodeURIComponent(JSON.stringify(enhanced))}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={[styles.closeButton, { position: 'absolute', left: 16, top: insets.top + 12 }]} onPress={goBack}>
          <X size={22} color={theme.accentPrimary} />
        </TouchableOpacity>

        <View style={styles.bigHeader}>
          <Text style={styles.bottomTitle}>How was the trail?</Text>
          <Text style={styles.bottomSubtitle}>Reviews help us make better suggestions</Text>
        </View>

        <View style={{ paddingHorizontal: 8 }}>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map((s) => (
              <TouchableOpacity key={s} style={[styles.starButton, rating >= s && { backgroundColor: theme.accentPrimary }]} onPress={() => setRating(s)}>
                <Text style={[styles.star, rating >= s && { color: theme.backgroundPrimary } ]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.bottomTitle, { marginTop: 18, fontSize: 20 }]}>Great! How would you describe it?</Text>
          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {DESCRIPTIONS.map((d, i) => (
              <TouchableOpacity key={d} onPress={() => toggleDescription(i)} style={[styles.chip, selected[i] && styles.chipSelected]}>
                <Text style={[styles.chipText, selected[i] && styles.chipTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 220 }} />
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 20 }}>
        <View style={styles.pagerDotsRow}>
          <View style={styles.pagerDot} />
          <View style={[styles.pagerDot, styles.pagerDotActive]} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButtonLarge} onPress={goNext}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
