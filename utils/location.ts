import * as Location from 'expo-location';

export async function getBestAvailableLocation(options: Location.LocationOptions = {}) {
  try {
    const loc = await Location.getCurrentPositionAsync(options);
    if (loc) return loc;
  } catch (err) {
    console.warn('getCurrentPositionAsync failed, falling back to getLastKnownPositionAsync', err);
  }

  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last) return last;
  } catch (err) {
    console.warn('getLastKnownPositionAsync failed', err);
  }

  return null;
}
