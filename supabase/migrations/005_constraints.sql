-- Additional constraints to prevent invalid states

-- Prevent claiming own shift
CREATE OR REPLACE FUNCTION prevent_self_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claimed_by = NEW.posted_by THEN
    RAISE EXCEPTION 'Cannot claim your own shift';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_claim_trigger
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  WHEN (NEW.claimed_by IS NOT NULL AND NEW.claimed_by = NEW.posted_by)
  EXECUTE FUNCTION prevent_self_claim();

-- Prevent duplicate claims (ensure only one claim per shift)
-- This is already handled by the status check, but we add an explicit constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_single_claim
  ON public.shifts(restaurant_id, shift_date, start_time, end_time)
  WHERE status = 'claimed';

-- Add check constraint to ensure claimed_by is set when status is 'claimed'
ALTER TABLE public.shifts
  ADD CONSTRAINT check_claimed_by_set
  CHECK (
    (status = 'claimed' AND claimed_by IS NOT NULL) OR
    (status != 'claimed')
  );

-- Add check constraint to ensure approved_by is set when status is 'approved' or 'denied'
ALTER TABLE public.shifts
  ADD CONSTRAINT check_approved_by_set
  CHECK (
    (status IN ('approved', 'denied') AND approved_by IS NOT NULL) OR
    (status NOT IN ('approved', 'denied'))
  );
