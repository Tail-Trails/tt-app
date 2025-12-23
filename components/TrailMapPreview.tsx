import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import TrailMap from './TrailMap';
import { Coordinate } from '@/types/trail';

interface TrailMapPreviewProps {
  coordinates?: Coordinate[];
  path?: number[][] | null;
  style?: any;
}

export default function TrailMapPreview({ coordinates, path, style }: TrailMapPreviewProps) {
  const coords = (coordinates && coordinates.length > 0)
    ? coordinates
    : (Array.isArray(path) ? path.map(p => ({ latitude: p[1], longitude: p[0] })) : []);

  const region = useMemo(() => {
    const c = coords ?? [];
    if (coords.length === 0) {
      return {
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = c.map(ci => ci.latitude);
    const lons = c.map(ci => ci.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    
    const latDelta = Math.max((maxLat - minLat) * 1.3, 0.005);
    const lonDelta = Math.max((maxLon - minLon) * 1.3, 0.005);

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  }, [coordinates, path]);

  return (
    <View style={[styles.container, style]}>
      <TrailMap
        style={styles.map}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        coordinates={coords}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
