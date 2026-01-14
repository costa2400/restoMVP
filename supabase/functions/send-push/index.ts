import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    const { shiftId, restaurantId, type } = await req.json();

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get shift details
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        *,
        posted_by_user:users!shifts_posted_by_fkey(*),
        restaurant:restaurants(*)
      `)
      .eq('id', shiftId)
      .single();

    if (shiftError || !shift) {
      throw new Error('Shift not found');
    }

    // Get verified servers at this restaurant
    const { data: verifications, error: verificationsError } = await supabase
      .from('verifications')
      .select('user_id, users!inner(push_token)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['verified', 'guest']);

    if (verificationsError) {
      throw verificationsError;
    }

    // Filter out the poster if it's a shift_posted notification
    const targetUserIds =
      type === 'shift_posted'
        ? verifications
            ?.filter((v) => v.user_id !== shift.posted_by)
            .map((v) => v.user_id) || []
        : verifications?.map((v) => v.user_id) || [];

    // Get push tokens for target users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('push_token')
      .in('id', targetUserIds)
      .not('push_token', 'is', null);

    if (usersError) {
      throw usersError;
    }

    // Prepare notification content
    let title = '';
    let body = '';

    switch (type) {
      case 'shift_posted':
        title = 'New Shift Available';
        body = `${shift.posted_by_user?.full_name || 'Someone'} posted a shift at ${shift.restaurant?.name}`;
        break;
      case 'shift_claimed':
        title = 'Shift Claimed';
        body = 'Your shift has been claimed and is pending approval';
        break;
      case 'approved':
        title = 'Shift Approved';
        body = 'Your shift claim has been approved!';
        break;
      case 'denied':
        title = 'Shift Denied';
        body = 'Your shift claim was denied by the manager';
        break;
    }

    // Send push notifications
    const pushPromises = (users || [])
      .filter((user) => user.push_token)
      .map((user) => {
        const payload: PushNotificationPayload = {
          to: user.push_token!,
          sound: 'default',
          title,
          body,
          data: { shiftId, type },
        };

        return fetch(EXPO_PUSH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(payload),
        });
      });

    await Promise.all(pushPromises);

    // Create notification records
    const notificationRecords = targetUserIds.map((userId) => ({
      user_id: userId,
      shift_id: shiftId,
      type,
      title,
      body,
      sent_at: new Date().toISOString(),
    }));

    await supabase.from('notifications').insert(notificationRecords);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
