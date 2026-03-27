import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import BackgroundGeolocation from 'react-native-background-geolocation';

interface WatchdogProps {
  isRecording: boolean;
  thresholdSeconds?: number; 
}

export const LocationWatchdog = ({ 
  isRecording, 
  thresholdSeconds = 15 
}: WatchdogProps) => {
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNotificationTime = useRef<number>(0);
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  const triggerAlert = async () => {
    const now = Date.now();
    
    // Only alert if we haven't alerted in the last 5 minutes
    if (now - lastNotificationTime.current > COOLDOWN_MS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "GPS Signal Lost 🐾",
          body: "We haven't detected movement recently. Tracking may be inaccurate until you're back outside.",
          sound: true,
          // New behavior props aren't needed here, only in the global handler
        },
        trigger: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      lastNotificationTime.current = now;
    }
  };

  const resetTimer = () => {
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    
    if (isRecording) {
      watchdogTimer.current = setTimeout(() => {
        triggerAlert();
      }, thresholdSeconds * 1000);
    }
  };

  useEffect(() => {
    // Listen to native location events
    const onLocation = BackgroundGeolocation.onLocation((location) => {
      const accuracy = location?.coords?.accuracy;

      if (typeof accuracy !== 'number') {
        return;
      }

      // Industry Standard: If accuracy > 100m, the signal is too "blurry" 
      // to count as a valid heartbeat for a trail.
      if (accuracy <= 100) {
        resetTimer();
      }
    });

    // Handle recording toggle
    if (isRecording) {
      resetTimer();
    } else {
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    }

    return () => {
      onLocation.remove();
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    };
  }, [isRecording, thresholdSeconds]);

  return null;
};