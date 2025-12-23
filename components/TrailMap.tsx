import React, { forwardRef } from 'react';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import colors from '@/constants/colors';

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
}

const TrailMap = forwardRef<MapView, TrailMapProps>(({
  coordinates,
  style,
  scrollEnabled = true,
  zoomEnabled = true,
  showsUserLocation = false,
  followsUserLocation = false,
  showsMyLocationButton = false,
  initialRegion,
}, ref) => {
  const coords = coordinates ?? [];
  const defaultRegion = coords.length > 0 ? {
    latitude: coords[0].latitude,
    longitude: coords[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={style}
      initialRegion={initialRegion || defaultRegion}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
    >
      {coords.length > 1 && (
        <Polyline
          coordinates={coords}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
});

export default TrailMap;
