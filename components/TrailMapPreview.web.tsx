import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import styles from './TrailMapPreview.styles';
import { Coordinate } from '@/types/trail';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Use hosted outdoors style for web
const OUTDOORS_STYLE_URL = 'https://api.tailtrails.club/map/style.json';


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
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // derive coords from coordinates or path
  const coords: Coordinate[] = (coordinates && coordinates.length > 0)
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
      style: OUTDOORS_STYLE_URL,
      center,
      zoom: coords.length > 0 ? 12 : 1,
      interactive: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // If we have a route (multiple points), draw it
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

      // If there's a single point, place a marker at the location and center
      else if (coords && coords.length === 1) {
        const pt = coords[0];
        // create a simple default marker
        if (markerRef.current) {
          markerRef.current.setLngLat([pt.longitude, pt.latitude]);
        } else {
          const m = new maplibregl.Marker({ color: '#5d6b4a' })
            .setLngLat([pt.longitude, pt.latitude])
            .addTo(map);
          markerRef.current = m;
        }

        map.setCenter([pt.longitude, pt.latitude]);
        map.setZoom(14);
      }
    });

    return () => {
      try {
        map.remove();
      } catch (e) {
        // ignore remove errors
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  // Recreate map when coordinates/path/start center change
  }, [JSON.stringify(coords), startLatitude, startLongitude]);

  return (
    <View style={[styles.container, style]}>
      {coords && coords.length > 0 ? (
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.text}>Map Preview (Web)</Text>
          <Text style={styles.subtext}>{coords?.length || 0} points recorded</Text>
        </View>
      )}
    </View>
  );
}

// styles imported from TrailMapPreview.styles.ts
