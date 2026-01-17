import React, { useEffect, forwardRef, useRef, useImperativeHandle } from 'react';

import { View, StyleSheet } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface TrailMapProps {
  coordinates: { latitude: number; longitude: number }[];
  style?: any;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

const TrailMap = forwardRef<any, TrailMapProps>(({ 
  coordinates, 
  style, 
  initialRegion,
  scrollEnabled = true,
  zoomEnabled = true,
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: any, duration: number = 500) => {
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [region.longitude, region.latitude],
          zoom: 14, // Approximate zoom for the delta
          duration: duration,
        });
      }
    },
    fitToCoordinates: (coords: any[], options: any = {}) => {
      if (mapRef.current && coords.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        coords.forEach(c => bounds.extend([c.longitude, c.latitude]));
        mapRef.current.fitBounds(bounds, { padding: options.edgePadding || 20 });
      }
    }
  }));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const center: [number, number] = initialRegion 
      ? [initialRegion.longitude, initialRegion.latitude]
      : coordinates.length > 0 
        ? [coordinates[0].longitude, coordinates[0].latitude]
        : [0, 0];

    const zoom = initialRegion ? 14 : 12;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Basic open style
      center: center,
      zoom: zoom,
      interactive: scrollEnabled && zoomEnabled,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (coordinates.length > 1) {
        map.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': coordinates.map(c => [c.longitude, c.latitude])
            }
          }
        });

        map.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#5d6b4a',
            'line-width': 4
          }
        });

        // Fit bounds to coordinates
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach(c => bounds.extend([c.longitude, c.latitude]));
        map.fitBounds(bounds, { padding: 20 });
      }
    });

    return () => {
      map.remove();
    };
  }, [coordinates, initialRegion, scrollEnabled, zoomEnabled]);

  return (
    <View style={[style, styles.container]}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%' }} 
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
});

export default TrailMap;
