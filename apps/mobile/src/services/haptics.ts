import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isHapticsAvailable = (): boolean => {
  return (
    Platform.OS !== 'web' &&
    typeof Haptics !== 'undefined' &&
    Haptics !== null
  );
};

export const triggerHaptic = {
  light: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.impactAsync === 'function') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // ignore
    }
  },
  medium: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.impactAsync === 'function') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // ignore
    }
  },
  heavy: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.impactAsync === 'function') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {
      // ignore
    }
  },
  success: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.notificationAsync === 'function') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // ignore
    }
  },
  warning: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.notificationAsync === 'function') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // ignore
    }
  },
  error: () => {
    try {
      if (isHapticsAvailable() && typeof Haptics.notificationAsync === 'function') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // ignore
    }
  },
};
