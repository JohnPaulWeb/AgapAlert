import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

let Notifications: typeof import("expo-notifications") | null = null;

// Expo SDK 53+ removed Android remote push notification functionality from Expo Go.
// We only load expo-notifications if NOT running in Expo Go on Android to prevent fatal runtime errors.
if (!(isRunningInExpoGo() && Platform.OS === "android")) {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.warn("Could not load expo-notifications:", e);
  }
}

export function setupNotificationHandler() {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Graceful fallback for Expo Go
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    // In Expo Go on Android, push notifications are disabled by Expo SDK 53+.
    // Return true for UI preview/testing purposes.
    return true;
  }
  try {
    const n = await Notifications.requestPermissionsAsync();
    return n.status === "granted";
  } catch {
    return false;
  }
}
