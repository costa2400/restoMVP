import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const { user } = useAuth();

  useEffect(() => {
    // Request notification permissions
    Notifications.requestPermissionsAsync();

    // Register for push notifications
    registerForPushNotifications();

    // Listen for notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data.shiftId) {
          // Navigate to shift detail - handled by expo-router
        }
      }
    );

    return () => subscription.remove();
  }, [user]);

  const registerForPushNotifications = async () => {
    if (!user) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      // Store push token in user profile
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="shift/[id]" />
      <Stack.Screen name="restaurant-search" />
      <Stack.Screen name="request-verification" />
    </Stack>
  );
}
