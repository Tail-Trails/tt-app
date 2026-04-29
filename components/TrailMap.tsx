import theme from '@/constants/colors';
import { forwardRef, useMemo, useRef, useImperativeHandle, useEffect, useState } from 'react';
import { View, Text as RNText, TouchableOpacity } from 'react-native';
import { Map as MLMapView, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import DogMarker from './DogMarker';

interface TrailMapProps {
  coordinates?: { latitude: number; longitude: number }[];
  guideCoordinates?: { latitude: number; longitude: number }[];
  style?: any;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  onUserLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  startCoordinate?: { latitude: number; longitude: number } | null;
  showsMyLocationButton?: boolean;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapStyleURL?: string;
  showOnlyPath?: boolean;
  showStartMarker?: boolean;
  routeColor?: string;
  routeWidth?: number;
  routeOpacity?: number;
  guideRouteColor?: string;
  guideRouteWidth?: number;
  guideRouteOpacity?: number;
  startMarkerColor?: string;
  pointMarkers?: { id: string; latitude: number; longitude: number; label?: string }[];
  onPointMarkerPress?: (id: string) => void;
}

const DEFAULT_STYLE = 'https://api.tailtrails.club/map/style.json';
const BLANK_STYLE: any = { version: 8, name: 'blank', sources: {}, layers: [] };

function latDeltaToZoom(latDelta?: number) {
  if (!latDelta) return 14;
  if (latDelta <= 0.005) return 16;
  if (latDelta <= 0.02) return 14;
  if (latDelta <= 0.1) return 12;
  return 10;
}

const TrailMap = forwardRef<any, TrailMapProps>(({
  coordinates,
  guideCoordinates,
  style,
  scrollEnabled = true,
  zoomEnabled = true,
  showsUserLocation = false,
  followsUserLocation = false,
  userLocation = null,
  onUserLocationUpdate,
  startCoordinate = null,
  initialRegion,
  mapStyleURL,
  showOnlyPath = false,
  showStartMarker = true,
  routeColor,
  routeWidth,
  routeOpacity,
  guideRouteColor,
  guideRouteWidth,
  guideRouteOpacity,
  startMarkerColor,
  pointMarkers,
  onPointMarkerPress,
}, ref) => {
  const coords = useMemo(() => coordinates ?? [], [coordinates]);
  const guideCoords = useMemo(() => guideCoordinates ?? [], [guideCoordinates]);
  const nativeMapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const hasCenteredOnOpenRef = useRef(false);

  const [liveUserLocation, setLiveUserLocation] = useState<{ latitude: number; longitude: number } | null>(userLocation);

  useEffect(() => {
    if (userLocation) setLiveUserLocation(userLocation);
  }, [userLocation]);

  // console.log('User location in TrailMap:', liveUserLocation);

  const center = useMemo(() => {
    if (initialRegion) return [initialRegion.longitude, initialRegion.latitude];
    if (coords.length > 0) return [coords[0].longitude, coords[0].latitude];
    if (guideCoords.length > 0) return [guideCoords[0].longitude, guideCoords[0].latitude];
    return undefined;
  }, [coords, guideCoords, initialRegion]);

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

  const guideGeojson = useMemo(() => {
    if (!guideCoords || guideCoords.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: guideCoords.map(c => [c.longitude, c.latitude]),
      },
    } as any;
  }, [guideCoords]);

  // Ensure the native route source is updated when our geojson changes.
  useEffect(() => {
    if (!nativeMapRef.current || !geojson) return;
    try {
      const src = nativeMapRef.current.getSource?.('routeSource');
      if (src && typeof src.setData === 'function') {
        src.setData(geojson);
      }
    } catch (e) {
      // Some map implementations may not expose getSource/setData; ignore.
    }
  }, [geojson]);

  const activeStyle = useMemo(() => (mapStyleURL ?? DEFAULT_STYLE), [mapStyleURL]);
  const effectiveStyle = useMemo(() => (showOnlyPath ? BLANK_STYLE : activeStyle), [activeStyle, showOnlyPath]);
  const zoom = useMemo(() => latDeltaToZoom(initialRegion?.latitudeDelta), [initialRegion]);
  const initialViewState = useMemo(() => {
    if (center) {
      return { center: center as [number, number], zoom };
    }
    return { zoom };
  }, [center, zoom]);
  const mapPointMarkers = useMemo(() => pointMarkers ?? [], [pointMarkers]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: any, duration: number = 500) => {
      if (!cameraRef.current) return;
      const z = latDeltaToZoom(region.latitudeDelta);
      cameraRef.current.easeTo({ center: [region.longitude, region.latitude], zoom: z, duration });
    },
    fitToCoordinates: (inCoords: any[], options: any = {}) => {
      if (!cameraRef.current || !inCoords || inCoords.length === 0) return;
      const lats = inCoords.map((c: any) => c.latitude);
      const lons = inCoords.map((c: any) => c.longitude);
      cameraRef.current.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { duration: options.duration ?? 2000 });
    }
  }));

  const shouldTrackUserLocation = showsUserLocation || followsUserLocation;
  // Prioritize parent-provided userLocation so RecordScreen controls the
  // stable location used for display and recording.
  const resolvedUserLocation = userLocation ?? liveUserLocation;

  useEffect(() => {
    // Intentionally skipped internal polling inside Map component.
    // Calling `getCurrentPosition` every 1000ms queues massive thread/plugin contention
    // causing stale coordinates to block genuinely live updates.
    // Instead, the root screen's `BackgroundGeolocation.onLocation` delivers fresh data naturally.
  }, [shouldTrackUserLocation, userLocation]);

  useEffect(() => {
    if (!followsUserLocation || !resolvedUserLocation) return;

    // When follow mode is enabled, always ease the camera to the latest
    // resolved user location so the map tracks movement live.
    cameraRef.current?.easeTo({
      center: [resolvedUserLocation.longitude, resolvedUserLocation.latitude],
      zoom,
      easing: 'fly',
      duration: 1000,
    });
  }, [followsUserLocation, resolvedUserLocation, zoom]);

  return (
    <MLMapView
      key={typeof effectiveStyle === 'string' ? effectiveStyle : 'blank-style'}
      ref={nativeMapRef}
      style={style}
      mapStyle={effectiveStyle}
      touchAndDoubleTapZoom={zoomEnabled}
      dragPan={scrollEnabled}
      attribution={false}
      logo={!showOnlyPath}
    >
      <Camera
        ref={cameraRef}
        initialViewState={initialViewState}
        easing="fly"
        duration={1000}
      />

      {guideGeojson && (
        <GeoJSONSource id="guideRouteSource" data={guideGeojson}>
          <Layer
            id="guideRouteLine"
            type="line"
            layout={
              {
                'line-cap': 'round',
                'line-join': 'round'
              }
            }
            paint={{
              'line-color': guideRouteColor ?? theme.accentSecondary,
              'line-width': guideRouteWidth ?? 4,
              'line-opacity': guideRouteOpacity ?? 0.6,
            }}
          />
        </GeoJSONSource>
      )}

      {geojson && (
        <GeoJSONSource id="routeSource" data={geojson}>
          <Layer
            id="routeLine"
            type="line"
            layout={
              {
                'line-cap': 'round',
                'line-join': 'round'
              }
            }
            paint={{
              'line-color': routeColor ?? theme.backgroundPrimary,
              'line-width': routeWidth ?? 4,
              'line-opacity': routeOpacity ?? 1,
            }}
          />
        </GeoJSONSource>
      )}

      {resolvedUserLocation && (
        <Marker
          key={`dog-marker-${resolvedUserLocation.latitude}-${resolvedUserLocation.longitude}`}
          id={`dogMarker-${resolvedUserLocation.latitude}-${resolvedUserLocation.longitude}`}
          lngLat={[resolvedUserLocation.longitude, resolvedUserLocation.latitude]}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <DogMarker size={50} color={theme.backgroundPrimary} />
          </View>
        </Marker>
      )}

      {showStartMarker && startCoordinate && (
        <Marker
          key="start-marker"
          id="startMarker"
          lngLat={[startCoordinate.longitude, startCoordinate.latitude]}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: startMarkerColor ?? theme.accentPrimary,
              borderWidth: 2,
              borderColor: theme.backgroundPrimary,
            }}
          >
            <RNText style={{ color: theme.backgroundPrimary, fontSize: 12, fontWeight: '700' }}>S</RNText>
          </View>
        </Marker>
      )}

      {mapPointMarkers.map((marker) => (
        <Marker
          key={`point-${marker.id}`}
          id={`point-${marker.id}`}
          lngLat={[marker.longitude, marker.latitude]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onPointMarkerPress?.(marker.id)}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                minWidth: 34,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 14,
                backgroundColor: theme.accentPrimary,
                borderWidth: 1,
                borderColor: theme.backgroundPrimary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RNText style={{ color: theme.backgroundPrimary, fontSize: 11, fontWeight: '700' }}>
                {marker.label ?? '•'}
              </RNText>
            </View>
          </TouchableOpacity>
        </Marker>
      ))}
    </MLMapView>
  );
});

TrailMap.displayName = 'TrailMap';

export default TrailMap;