import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Coordinate } from '@/types/trail';
import * as maplibregl from 'maplibre-gl';


interface TrailMapPreviewProps {
  coordinates?: Coordinate[];
  // backend may return path as [[lon, lat], ...]
  path?: number[][] | null;
  style?: any;
  height?: number | string;
  startLatitude?: number | null;
  startLongitude?: number | null;
}

export default function TrailMapPreview({ coordinates, path, style, height = 260, startLatitude = null, startLongitude = null }: TrailMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // derive coords from coordinates or path
  const coords = (coordinates && coordinates.length > 0)
    ? coordinates
    : (Array.isArray((path as any)) ? (path as number[][]).map(p => ({ latitude: p[1], longitude: p[0] })) : []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const center: [number, number] = (startLatitude != null && startLongitude != null)
      ? [startLongitude, startLatitude]
      : (coords.length > 0 ? [coords[0].longitude, coords[0].latitude] : [0, 0]);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom: coords.length > 0 ? 12 : 1,
      interactive: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (coords && coords.length > 1) {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords.map(c => [c.longitude, c.latitude]),
          }
        } as any;

        if (map.getSource('preview-route')) {
          (map.getSource('preview-route') as maplibregl.GeoJSONSource).setData(geojson);
        } else {
          map.addSource('preview-route', { type: 'geojson', data: geojson });

          map.addLayer({
            id: 'preview-route',
            type: 'line',
            source: 'preview-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#5d6b4a', 'line-width': 3 }
          });
        }

        const bounds = new maplibregl.LngLatBounds();
        coords.forEach(c => bounds.extend([c.longitude, c.latitude]));
        map.fitBounds(bounds, { padding: 10, maxZoom: 16 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainerRef]);

  return (
    <View style={[styles.container, style]}>
      {coordinates && coordinates.length > 0 ? (
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.text}>Map Preview (Web)</Text>
          <Text style={styles.subtext}>{coordinates?.length || 0} points recorded</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  text: {
    color: '#5d6b4a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});
