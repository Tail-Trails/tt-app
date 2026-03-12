import React from 'react';
import { View } from 'react-native';

// Expose named exports used in native code as simple components that render nothing on web.
export const Map = (props) => <View {...props} />;
export const Camera = (props) => <View {...props} />;
export const UserLocation = (props) => <View {...props} />;
export const GeoJSONSource = (props) => <View {...props} />;
export const Layer = (props) => <View {...props} />;
export const Marker = (props) => <View {...props} />;

// default export as an object with common components
export default {
  Map,
  Camera,
  UserLocation,
  GeoJSONSource,
  Layer,
  Marker,
};
