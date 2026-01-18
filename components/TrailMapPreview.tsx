import React, { useMemo } from 'react';
import { View } from 'react-native';
import styles from './TrailMapPreview.styles';
import TrailMap from './TrailMap';
import { Coordinate } from '@/types/trail';

interface TrailMapPreviewProps {
  coordinates?: Coordinate[];
  path?: number[][] | null;
  style?: any;
  startLatitude?: number | null;
  startLongitude?: number | null;
}

export default function TrailMapPreview({ coordinates, path, style, startLatitude = null, startLongitude = null }: TrailMapPreviewProps) {
  const coords = (coordinates && coordinates.length > 0)
    ? coordinates
    : (Array.isArray(path) ? path.map(p => ({ latitude: p[1], longitude: p[0] })) : []);

  const region = useMemo(() => {
    const c = coords ?? [];
    if (coords.length === 0 && (startLatitude == null || startLongitude == null)) {
      return {
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // If explicit start coordinates are provided prefer centering on them.
    if ((startLatitude != null) && (startLongitude != null)) {
      return {
        latitude: startLatitude,
        longitude: startLongitude,
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

// styles imported from TrailMapPreview.styles.ts
