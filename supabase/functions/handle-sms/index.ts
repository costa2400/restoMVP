import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

serve(async (req) => {
  try {
    // Parse Twilio webhook data
    const formData = await req.formData();
    const from = formData.get('From')?.toString();
    const body = formData.get('Body')?.toString()?.trim().toUpperCase();

    if (!from || !body) {
      return new Response('Missing From or Body', { status: 400 });
    }

    // Determine approval action
    let approved: boolean | null = null;
    if (body === 'A' || body.startsWith('APPROVE')) {
      approved = true;
    } else if (body === 'D' || body.startsWith('DENY')) {
      approved = false;
    } else {
      // Try to extract shift ID from message if format is different
      return new Response('Invalid response. Reply A to approve or D to deny.', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Initialize Supabase client
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

    // Find manager by phone number
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', from)
      .eq('role', 'manager')
      .single();

    if (managerError || !manager) {
      return new Response('Manager not found', { status: 404 });
    }

    // Find pending shift for this manager's restaurant
    // We need to get the most recent shift that needs approval
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('manager_id', manager.id);

    if (restaurantsError || !restaurants || restaurants.length === 0) {
      return new Response('No restaurants found for manager', { status: 404 });
    }

    const restaurantIds = restaurants.map((r) => r.id);

    // Get the most recent claimed shift for this manager's restaurants
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, claimed_by, posted_by')
      .in('restaurant_id', restaurantIds)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .limit(1);

    if (shiftsError || !shifts || shifts.length === 0) {
      return new Response(
        'No pending shifts found. The shift may have already been processed.',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const shift = shifts[0];

    // Update shift status
    const newStatus = approved ? 'approved' : 'denied';
    const { error: updateError } = await supabase
      .from('shifts')
      .update({
        status: newStatus,
        approved_by: manager.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', shift.id);

    if (updateError) {
      throw updateError;
    }

    // Create notifications for both servers
    const notifications = [
      {
        user_id: shift.posted_by,
        shift_id: shift.id,
        type: approved ? 'approved' : 'denied',
        title: approved ? 'Shift Approved' : 'Shift Denied',
        body: approved
          ? 'Your shift has been approved by the manager'
          : 'Your shift claim was denied by the manager',
        sent_at: new Date().toISOString(),
      },
      {
        user_id: shift.claimed_by,
        shift_id: shift.id,
        type: approved ? 'approved' : 'denied',
        title: approved ? 'Shift Approved' : 'Shift Denied',
        body: approved
          ? 'Your shift claim has been approved!'
          : 'Your shift claim was denied',
        sent_at: new Date().toISOString(),
      },
    ];

    await supabase.from('notifications').insert(notifications);

    // Trigger push notifications
    await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        shiftId: shift.id,
        restaurantId: restaurantIds[0],
        type: approved ? 'approved' : 'denied',
      }),
    });

    // Return TwiML response
    const responseMessage = approved
      ? 'Shift approved successfully!'
      : 'Shift denied.';

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseMessage}</Message></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    console.error('Error handling SMS:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>An error occurred processing your request.</Message></Response>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
});
