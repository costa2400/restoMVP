import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const shiftId = url.searchParams.get('shift_id');

    if (!shiftId) {
      return new Response('Missing shift_id parameter', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

    // Get shift details
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
      return new Response('Shift not found', { status: 404 });
    }

    // Handle POST request (approval action)
    if (req.method === 'POST') {
      const formData = await req.formData();
      const action = formData.get('action');

      if (action !== 'approve' && action !== 'deny') {
        return new Response('Invalid action', { status: 400 });
      }

      // Get manager from restaurant
      const { data: manager } = await supabase
        .from('users')
        .select('id')
        .eq('id', shift.restaurant.manager_id)
        .single();

      if (!manager) {
        return new Response('Manager not found', { status: 404 });
      }

      const newStatus = action === 'approve' ? 'approved' : 'denied';

      // Update shift
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          status: newStatus,
          approved_by: manager.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', shiftId);

      if (updateError) {
        throw updateError;
      }

      // Create notifications
      const notifications = [
        {
          user_id: shift.posted_by,
          shift_id: shiftId,
          type: newStatus,
          title: newStatus === 'approved' ? 'Shift Approved' : 'Shift Denied',
          body:
            newStatus === 'approved'
              ? 'Your shift has been approved'
              : 'Your shift claim was denied',
          sent_at: new Date().toISOString(),
        },
        {
          user_id: shift.claimed_by,
          shift_id: shiftId,
          type: newStatus,
          title: newStatus === 'approved' ? 'Shift Approved' : 'Shift Denied',
          body:
            newStatus === 'approved'
              ? 'Your shift claim has been approved!'
              : 'Your shift claim was denied',
          sent_at: new Date().toISOString(),
        },
      ];

      await supabase.from('notifications').insert(notifications);

      // Return success page
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Shift ${newStatus === 'approved' ? 'Approved' : 'Denied'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .success { color: #4CAF50; }
    .error { color: #f44336; }
  </style>
</head>
<body>
  <h1 class="${newStatus === 'approved' ? 'success' : 'error'}">
    Shift ${newStatus === 'approved' ? 'Approved' : 'Denied'}
  </h1>
  <p>The shift has been ${newStatus} successfully.</p>
</body>
</html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Handle GET request (display approval page)
    const shiftDate = new Date(shift.shift_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Approve Shift</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    .shift-info {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    button {
      flex: 1;
      padding: 15px;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .approve {
      background: #4CAF50;
      color: white;
    }
    .deny {
      background: #f44336;
      color: white;
    }
    button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <h1>Approve Shift Request</h1>
  <div class="shift-info">
    <p><strong>Restaurant:</strong> ${shift.restaurant?.name || 'Unknown'}</p>
    <p><strong>Date:</strong> ${shiftDate}</p>
    <p><strong>Time:</strong> ${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}</p>
    <p><strong>Posted by:</strong> ${shift.posted_by_user?.full_name || 'Unknown'}</p>
    <p><strong>Claimed by:</strong> ${shift.claimed_by_user?.full_name || 'Unknown'}</p>
    ${shift.notes ? `<p><strong>Notes:</strong> ${shift.notes}</p>` : ''}
  </div>
  <form method="POST">
    <div class="button-group">
      <button type="submit" name="action" value="approve" class="approve">
        Approve
      </button>
      <button type="submit" name="action" value="deny" class="deny">
        Deny
      </button>
    </div>
  </form>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error in web approval:', error);
    return new Response('An error occurred', { status: 500 });
  }
});
