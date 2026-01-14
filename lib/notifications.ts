import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function registerForPushNotifications(userId: string) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store push token in user profile
    await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export function setupNotificationHandlers(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // Handle notifications received while app is in foreground
  Notifications.addNotificationReceivedListener(onNotificationReceived);

  // Handle notification taps
  Notifications.addNotificationResponseReceivedListener(onNotificationTapped);
}
