import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Pressable, Switch, LayoutChangeEvent } from 'react-native';
import { Text } from '@/components';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Waves, TreePine, TrafficCone, Mountain } from 'lucide-react-native';
import styles from './review.styles';
import Slider from '@react-native-community/slider';
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
  const [dogTraffic, setDogTraffic] = useState(50);
  const [footTraffic, setFootTraffic] = useState(50);
  const [paths, setPaths] = useState(50);
  const [exposure, setExposure] = useState(50);
  const [offLeash, setOffLeash] = useState(false);
  const [wildlife, setWildlife] = useState(false);

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
    const enhanced = {
      ...draft,
      rating,
      tags: picked,
      dogTraffic,
      footTraffic,
      paths,
      exposure,
      offLeash,
      wildlife,
    };
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
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={dogTraffic}
              onValueChange={(v: number) => setDogTraffic(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>High traffic</Text>
              <Text style={styles.helperRight}>Low traffic</Text>
            </View>
          </View>

          <View style={{ height: 12 }} />
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Foot Traffic Level</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={footTraffic}
              onValueChange={(v: number) => setFootTraffic(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>High traffic</Text>
              <Text style={styles.helperRight}>Low traffic</Text>
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
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={paths}
              onValueChange={(v: number) => setPaths(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Open wide</Text>
              <Text style={styles.helperRight}>Narrow paths</Text>
            </View>
          </View>

          <View style={{ height: 18 }} />
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Exposure</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={exposure}
              onValueChange={(v: number) => setExposure(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Shaded</Text>
              <Text style={styles.helperRight}>Exposed</Text>
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
