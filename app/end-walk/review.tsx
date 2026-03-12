import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Pressable, Switch, LayoutChangeEvent } from 'react-native';
import { Text } from '@/components';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Waves, TreePine, TrafficCone, Mountain } from 'lucide-react-native';
import styles from './review.styles';
import theme from '@/constants/colors';

const DESCRIPTIONS = ['Beach', 'Forest', 'Road', 'Cliff'];
const ICONS = [Waves, TreePine, TrafficCone, Mountain];

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
  const [dogTraffic, setDogTraffic] = useState(0.5);
  const [footTraffic, setFootTraffic] = useState(0.5);
  const [paths, setPaths] = useState(0.5);
  const [exposure, setExposure] = useState(0.5);
  const [offLeash, setOffLeash] = useState(false);
  const [wildlife, setWildlife] = useState(false);
  const trackRefs = useRef<Record<string, { width: number }>>({});

  useEffect(() => {
    // if rating came from params, prefill a selection (optional)
    if (initialRating) setRating(initialRating);
  }, [initialRating]);

  const toggleDescription = (idx: number) => {
    setSelected(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const onTrackLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    trackRefs.current[key] = { width };
  };

  const handleTrackPress = (key: string, setter: (v: number) => void) => (e: any) => {
    const x = e.nativeEvent.locationX;
    const w = trackRefs.current[key]?.width || 1;
    let v = x / w;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    setter(v);
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
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}> 
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

          <View style={styles.bigHeader}>
            <Text style={styles.bottomTitle}>How was the trail?</Text>
            <Text style={styles.bottomSubtitle}>Reviews help us make better suggestions</Text>
          </View>

          <View style={{ paddingHorizontal: 8 }}>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map((s) => (
              <TouchableOpacity key={s} style={[styles.starButton]} onPress={() => setRating(s)}>
                <Text style={[styles.star, rating >= s && { color: theme.accentPrimary } ]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.bottomTitle, { marginTop: 18, fontSize: 20 }]}>Great! How would you describe it?</Text>
          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {DESCRIPTIONS.map((d, i) => {
              const Icon = ICONS[i];
              return (
                <TouchableOpacity key={d} onPress={() => toggleDescription(i)} style={[styles.chip, selected[i] && styles.chipSelected]}>
                  <View>
                    <Icon size={24} color={selected[i] ? theme.backgroundPrimary : theme.textMuted} />
                  </View>
                  <Text style={[styles.chipText, selected[i] && styles.chipTextSelected]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 18 }} />

          <View style={styles.section}>
            <Text style={styles.cardTitle}>Dog Traffic Level</Text>
            <View onLayout={onTrackLayout('dog')}>
              <Pressable onPress={handleTrackPress('dog', setDogTraffic)} style={styles.trackContainer}>
                <View style={styles.track} />
                <View style={{ position: 'absolute', left: `${dogTraffic * 100}%`, transform: [{ translateX: -11 }], top: 9 }}>
                  <View style={styles.thumb} />
                </View>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={styles.label}>High traffic</Text>
              <Text style={styles.label}>Low traffic</Text>
            </View>
          </View>

          <View style={{ height: 12 }} />
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Foot Traffic Level</Text>
            <View onLayout={onTrackLayout('foot')}>
              <Pressable onPress={handleTrackPress('foot', setFootTraffic)} style={styles.trackContainer}>
                <View style={styles.track} />
                <View style={{ position: 'absolute', left: `${footTraffic * 100}%`, transform: [{ translateX: -11 }], top: 9 }}>
                  <View style={styles.thumb} />
                </View>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={styles.label}>High traffic</Text>
              <Text style={styles.label}>Low traffic</Text>
            </View>
          </View>

          <View style={{ height: 18 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Off-leash friendly</Text>
            <Switch value={offLeash} onValueChange={setOffLeash} />
          </View>

          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Wildlife / livestock present</Text>
            <Switch value={wildlife} onValueChange={setWildlife} />
          </View>

          <View style={{ height: 18 }} />
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Paths</Text>
            <View onLayout={onTrackLayout('paths')}>
              <Pressable onPress={handleTrackPress('paths', setPaths)} style={styles.trackContainer}>
                <View style={styles.track} />
                <View style={{ position: 'absolute', left: `${paths * 100}%`, transform: [{ translateX: -11 }], top: 9 }}>
                  <View style={styles.thumb} />
                </View>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={styles.label}>Open wide</Text>
              <Text style={styles.label}>Narrow paths</Text>
            </View>
          </View>

          <View style={{ height: 18 }} />
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Exposure</Text>
            <View onLayout={onTrackLayout('exposure')}>
              <Pressable onPress={handleTrackPress('exposure', setExposure)} style={styles.trackContainer}>
                <View style={styles.track} />
                <View style={{ position: 'absolute', left: `${exposure * 100}%`, transform: [{ translateX: -11 }], top: 9 }}>
                  <View style={styles.thumb} />
                </View>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={styles.label}>Shaded</Text>
              <Text style={styles.label}>Exposed</Text>
            </View>
          </View>
          <View style={{ height: 24 }} />

          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}> 
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
