-- Function to update expired shifts
CREATE OR REPLACE FUNCTION update_expired_shifts()
RETURNS void AS $$
BEGIN
  UPDATE public.shifts
  SET status = 'expired'
  WHERE status IN ('open', 'claimed')
    AND shift_date < CURRENT_DATE
    AND (shift_date < CURRENT_DATE OR (shift_date = CURRENT_DATE AND end_time < CURRENT_TIME));
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job (using pg_cron if available, otherwise manual trigger)
-- For Supabase, you can set up a cron job in the dashboard or use Edge Functions
-- This migration creates the function that can be called periodically
