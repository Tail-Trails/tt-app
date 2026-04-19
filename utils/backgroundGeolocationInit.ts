import BackgroundGeolocation, {
  AuthorizationEvent,
  Location as BGLocation,
  MotionChangeEvent,
  ProviderChangeEvent,
} from 'react-native-background-geolocation';
import { BG_DISTANCE_FILTER_METERS } from '@/utils/backgroundTracking';

type InitBackgroundTrackingOptions = {
  onLocation: (location: BGLocation) => void;
  onLocationError?: (error: any) => void;
  onMotionChange?: (event: MotionChangeEvent) => void;
  onProviderChange?: (event: ProviderChangeEvent) => void;
  onAuthorization?: (event: AuthorizationEvent) => void;
};

export async function initBackgroundTracking(options: InitBackgroundTrackingOptions) {
  // Register JS listeners immediately so native events won't be sent with
  // "no listeners registered" if the native side emits before `ready()` completes.
  BackgroundGeolocation.onLocation(options.onLocation, options.onLocationError);

  if (options.onMotionChange) {
    BackgroundGeolocation.onMotionChange(options.onMotionChange);
  }

  if (options.onProviderChange) {
    BackgroundGeolocation.onProviderChange(options.onProviderChange);
  }

  if (options.onAuthorization) {
    BackgroundGeolocation.onAuthorization(options.onAuthorization);
  }

  // Then configure the plugin. `ready()` is async and may take time; listeners
  // are already attached above to avoid race conditions.
  await BackgroundGeolocation.ready({
    desiredAccuracy: (BackgroundGeolocation as any).DESIRED_ACCURACY_HIGH,
    distanceFilter: BG_DISTANCE_FILTER_METERS,
    stopOnTerminate: false,
    startOnBoot: false,
    reset: false,
  } as any);
}
