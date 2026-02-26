import theme from '@/constants/colors';
import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { Map as MLMapView, Camera, UserLocation, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import DogMarker from './DogMarker';

  interface TrailMapProps {
    coordinates?: { latitude: number; longitude: number }[];
    style?: any;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    showsUserLocation?: boolean;
    followsUserLocation?: boolean;
    userLocation?: { latitude: number; longitude: number } | null;
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
    userLocation = null,
    showsMyLocationButton = false,
    initialRegion,
    mapStyleURL,
  }, ref) => {
    const coords = coordinates ?? [];
    const nativeMapRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

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

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: any, duration: number = 500) => {
        if (!cameraRef.current) return;
        const z = latDeltaToZoom(region.latitudeDelta);
        try {
          cameraRef.current.easeTo({ center: [region.longitude, region.latitude], zoom: z, duration });
        } catch (e) {
          // ignore if native method not available
        }
      },
      fitToCoordinates: (inCoords: any[], options: any = {}) => {
        if (!cameraRef.current || !inCoords || inCoords.length === 0) return;
        const lats = inCoords.map((c: any) => c.latitude);
        const lons = inCoords.map((c: any) => c.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        try {
          // bounds: [[swLng, swLat], [neLng, neLat]]
          cameraRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], { duration: options.duration ?? 2000 });
        } catch (e) {
          // ignore
        }
      }
    }));

    const extraNativeProps: any = { zoomEnabled, scrollEnabled, attributionEnabled: false };

    return (
      <MLMapView
        key={activeStyleURI}
        ref={nativeMapRef}
        style={style}
        mapStyle={activeStyleURI}
        {...extraNativeProps}
      >
        {showsUserLocation && <UserLocation />}

        {followsUserLocation && userLocation ? (
          <Camera
            ref={cameraRef}
            initialViewState={{ center: [userLocation.longitude, userLocation.latitude] as [number, number], zoom }}
          />
        ) : (
          center && (
            <Camera
              ref={cameraRef}
              initialViewState={{ center: center as [number, number], zoom }}
            />
          )
        )}

        {geojson && (
          <GeoJSONSource id="routeSource" data={geojson}>
            <Layer
              id="routeLine"
              type="line"
              paint={{ 'line-color': theme.backgroundPrimary, 'line-width': 4 }}
            />
          </GeoJSONSource>
        )}

        {userLocation && (
          <Marker id="userMarker" lngLat={[userLocation.longitude, userLocation.latitude] as [number, number]}>
            <DogMarker size={50} color={theme.backgroundPrimary} />
          </Marker>
        )}
      </MLMapView>
    );
  });

  export default TrailMap;

