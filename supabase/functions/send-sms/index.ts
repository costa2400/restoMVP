import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

serve(async (req) => {
  try {
    const { shiftId } = await req.json();

    // Initialize Supabase client with service role key
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

    // Get shift details with relations
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        *,
        posted_by_user:users!shifts_posted_by_fkey(*),
        claimed_by_user:users!shifts_claimed_by_fkey(*),
        restaurant:restaurants(*)
      `)
      .eq('id', shiftId)
      .single();

    if (shiftError || !shift) {
      throw new Error('Shift not found');
    }

    // Get manager phone number
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('phone')
      .eq('id', shift.restaurant.manager_id)
      .single();

    if (managerError || !manager?.phone) {
      throw new Error('Manager phone number not found');
    }

    // Format shift date
    const shiftDate = new Date(shift.shift_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format message
    const claimedByName = shift.claimed_by_user?.full_name || 'A server';
    const postedByName = shift.posted_by_user?.full_name || 'A server';
    const restaurantName = shift.restaurant?.name || 'the restaurant';

    // Create approval web URL
    const approvalUrl = `${SUPABASE_URL.replace(
      '.supabase.co',
      '.supabase.co'
    )}/functions/v1/web-approval?shift_id=${shiftId}`;

    const message = `${claimedByName} wants to cover ${postedByName}'s shift on ${shiftDate} at ${restaurantName}. Reply A to approve, D to deny. Or visit: ${approvalUrl}`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('To', manager.phone);
    formData.append('Body', message);

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${errorText}`);
    }

    // Create notification record
    await supabase.from('notifications').insert({
      user_id: shift.restaurant.manager_id,
      shift_id: shiftId,
      type: 'approval_needed',
      title: 'Shift Approval Needed',
      body: message,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
