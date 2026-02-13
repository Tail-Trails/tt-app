import theme from '@/constants/colors';
import { forwardRef, useMemo } from 'react';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
// MapLibre's react-native types may not include all runtime props (styleURL etc.).
// Cast the MapView to `any` to avoid TS complaints while preserving runtime behavior.
const MLMapView: any = (MapLibreGL as any).MapView;

  interface TrailMapProps {
    coordinates?: { latitude: number; longitude: number }[];
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
    mapStyleURL?: string;
  }

  const DEFAULT_STYLE = 'https://api.tailtrails.club/map/style.json';
  // const DEFAULT_STYLE = 'https://provaccination-apophthegmatical-sindy.ngrok-free.dev/map/style.json';
  // const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
  // const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/positron';


  function latDeltaToZoom(latDelta?: number) {
    if (!latDelta) return 14;
    if (latDelta <= 0.005) return 16;
    if (latDelta <= 0.02) return 14;
    if (latDelta <= 0.1) return 12;
    return 10;
  }

  const TrailMap = forwardRef<any, TrailMapProps>(({ 
    coordinates,
    style,
    scrollEnabled = true,
    zoomEnabled = true,
    showsUserLocation = false,
    followsUserLocation = false,
    showsMyLocationButton = false,
    initialRegion,
    mapStyleURL,
  }, ref) => {
    const coords = coordinates ?? [];

    const center = useMemo(() => {
      if (initialRegion) return [initialRegion.longitude, initialRegion.latitude];
      if (coords.length === 0) return undefined;
      const lat = coords[0].latitude;
      const lon = coords[0].longitude;
      return [lon, lat];
    }, [coords, initialRegion]);

    const geojson = useMemo(() => {
      if (!coords || coords.length < 2) return null;
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords.map(c => [c.longitude, c.latitude]),
        },
      } as any;
    }, [coords]);

    // Use hosted style URL by default for native; allow override via `mapStyleURL` prop.
    const activeStyleURI = useMemo(() => mapStyleURL ?? DEFAULT_STYLE, [mapStyleURL]);

    const zoom = useMemo(() => {
      const latDelta = initialRegion?.latitudeDelta;
      return latDeltaToZoom(latDelta);
    }, [initialRegion]);

    return (
      <MLMapView
        key={activeStyleURI}
        ref={ref}
        style={style}
        mapStyle={activeStyleURI}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        attributionEnabled={false}
      >
        {showsUserLocation && <MapLibreGL.UserLocation />}
        {center && (
          <MapLibreGL.Camera
            centerCoordinate={center}
            zoomLevel={zoom}
            // animationMode={'flyTo'}
          />
        )}

        {geojson && (
          <MapLibreGL.ShapeSource id="routeSource" shape={geojson}>
            <MapLibreGL.LineLayer
              id="routeLine"
              style={{ lineColor: theme.backgroundPrimary, lineWidth: 4 }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MLMapView>
    );
  });

  export default TrailMap;

