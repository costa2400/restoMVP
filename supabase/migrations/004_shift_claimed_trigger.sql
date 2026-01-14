-- Trigger function to call send-sms Edge Function when shift is claimed
CREATE OR REPLACE FUNCTION notify_manager_on_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if shift status changed to 'claimed' and claimed_by is set
  IF NEW.status = 'claimed' AND NEW.claimed_by IS NOT NULL AND OLD.status != 'claimed' THEN
    -- Call Edge Function via HTTP (this will be handled by Supabase webhooks or Edge Function triggers)
    -- For now, we'll create a notification record that can be picked up by a scheduled job
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-sms',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object('shift_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER shift_claimed_notification
  AFTER UPDATE ON public.shifts
  FOR EACH ROW
  WHEN (NEW.status = 'claimed' AND NEW.claimed_by IS NOT NULL AND OLD.status != 'claimed')
  EXECUTE FUNCTION notify_manager_on_claim();

-- Note: In production, you may want to use Supabase's webhook system or
-- call the Edge Function directly from your application code when claiming a shift
