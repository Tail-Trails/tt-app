// Minimal shim for map components on web — no-op implementations.
// Avoid JSX so this file remains plain JS and can be minified by Terser.
export const Map = function Map() { return null; };
export const Camera = function Camera() { return null; };
export const UserLocation = function UserLocation() { return null; };
export const GeoJSONSource = function GeoJSONSource() { return null; };
export const Layer = function Layer() { return null; };
export const Marker = function Marker() { return null; };

export default {
  Map,
  Camera,
  UserLocation,
  GeoJSONSource,
  Layer,
  Marker,
};
