import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '@/constants/colors';

interface TrailMapProps {
  coordinates?: { latitude: number; longitude: number }[];
  style?: any;
  mapStyleURL?: string;
  showOnlyPath?: boolean;
}

export default function TrailMapWeb({ coordinates = [], style, mapStyleURL }: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let mounted = true;
    // ensure maplibre-gl CSS is available (use unpkg CDN as a fallback)
    if (!document.querySelector('link[data-maplibre-css]')) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('data-maplibre-css', '1');
      link.setAttribute('href', 'https://unpkg.com/maplibre-gl/dist/maplibre-gl.css');
      document.head.appendChild(link);
    }

    // dynamic import to avoid requiring maplibre on native
    import('maplibre-gl').then((maplibregl) => {
      if (!mounted || !containerRef.current) return;
      const Map = (maplibregl as any).default || maplibregl;

      const center = coordinates && coordinates.length ? [coordinates[0].longitude, coordinates[0].latitude] : [0, 0];
      const map = new Map.Map({
        container: containerRef.current as HTMLElement,
        style: mapStyleURL || 'https://api.tailtrails.club/map/style.json',
        center,
        zoom: 13,
      });

      mapRef.current = map;

      // add route if provided
      if (coordinates && coordinates.length > 1) {
        const coords = coordinates.map(c => [c.longitude, c.latitude]);
        map.on('load', () => {
          if (!map.getSource('route')) {
            map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
            map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': theme.backgroundPrimary, 'line-width': 4 } });
          } else {
            const s = map.getSource('route');
            s.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
          }
        });
      }

      return undefined;
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load maplibre-gl on web:', err);
    });

    return () => { mounted = false; if (mapRef.current) { try { mapRef.current.remove(); } catch {} } };
  }, [coordinates, mapStyleURL]);

  if (!coordinates || coordinates.length === 0) {
    return <View style={[styles.empty, style]} />;
  }

  return (
    <View style={[styles.container, style as any]}>
      <div ref={containerRef as any} style={styles.map as any} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: '#eee',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  empty: {
    width: '100%',
    height: 200,
    backgroundColor: '#f6f6f6',
  },
});
