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
  await BackgroundGeolocation.ready({
    desiredAccuracy: (BackgroundGeolocation as any).DESIRED_ACCURACY_HIGH,
    distanceFilter: BG_DISTANCE_FILTER_METERS,
    stopOnTerminate: false,
    startOnBoot: false,
    reset: false,
  } as any);

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
}
