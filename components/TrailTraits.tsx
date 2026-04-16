import React from 'react';
import { View, Switch, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '@/components';
import theme from '@/constants/colors';

type Props = {
  trail: any;
  setTrail: (updater: any) => void;
};

export default function TrailTraits({ trail, setTrail }: Props) {
  if (!trail) return null;

  const patch = (key: string, value: any) => {
    setTrail((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: theme.textMuted, marginBottom: 8 }}>Dog traffic</Text>
      <Slider
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={typeof trail.dogTraffic === 'number' ? trail.dogTraffic : 50}
        onValueChange={(v: number) => patch('dogTraffic', Math.round(v))}
        minimumTrackTintColor={theme.accentPrimary}
        maximumTrackTintColor={theme.borderSubtle}
        thumbTintColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />

      <Text style={{ color: theme.textMuted, marginTop: 12, marginBottom: 8 }}>Foot traffic</Text>
      <Slider
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={typeof trail.footTraffic === 'number' ? trail.footTraffic : 50}
        onValueChange={(v: number) => patch('footTraffic', Math.round(v))}
        minimumTrackTintColor={theme.accentPrimary}
        maximumTrackTintColor={theme.borderSubtle}
        thumbTintColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />

      <Text style={{ color: theme.textMuted, marginTop: 12, marginBottom: 8 }}>Paths</Text>
      <Slider
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={typeof trail.paths === 'number' ? trail.paths : 50}
        onValueChange={(v: number) => patch('paths', Math.round(v))}
        minimumTrackTintColor={theme.accentPrimary}
        maximumTrackTintColor={theme.borderSubtle}
        thumbTintColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />

      <Text style={{ color: theme.textMuted, marginTop: 12, marginBottom: 8 }}>Exposure</Text>
      <Slider
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={typeof trail.exposure === 'number' ? trail.exposure : 50}
        onValueChange={(v: number) => patch('exposure', Math.round(v))}
        minimumTrackTintColor={theme.accentPrimary}
        maximumTrackTintColor={theme.borderSubtle}
        thumbTintColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: theme.textMuted }}>Off-leash</Text>
        <Switch
          value={!!trail.offLeash}
          onValueChange={(v) => patch('offLeash', v)}
          trackColor={{ false: theme.backgroundSecondary, true: theme.accentPrimary }}
          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: theme.textMuted }}>Wildlife</Text>
        <Switch
          value={!!trail.wildlife}
          onValueChange={(v) => patch('wildlife', v)}
          trackColor={{ false: theme.backgroundSecondary, true: theme.accentPrimary }}
          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
        />
      </View>
    </View>
  );
}
