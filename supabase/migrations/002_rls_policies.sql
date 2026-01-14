-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can see other users' basic info (for shift details)
CREATE POLICY "Users can see other users basic info"
  ON public.users FOR SELECT
  USING (true);

-- Restaurants policies
-- Anyone can read restaurants (for search)
CREATE POLICY "Anyone can read restaurants"
  ON public.restaurants FOR SELECT
  USING (true);

-- Managers can update their own restaurants
CREATE POLICY "Managers can update own restaurants"
  ON public.restaurants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
      AND id = restaurants.manager_id
    )
  );

-- Verifications policies
-- Users can see their own verifications
CREATE POLICY "Users can see own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Managers can see verifications for their restaurants
CREATE POLICY "Managers can see restaurant verifications"
  ON public.verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = verifications.restaurant_id
      AND manager_id = auth.uid()
    )
  );

-- Users can request verification (insert)
CREATE POLICY "Users can request verification"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Managers can verify users at their restaurants
CREATE POLICY "Managers can verify users"
  ON public.verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = verifications.restaurant_id
      AND manager_id = auth.uid()
    )
  );

-- Shifts policies
-- Servers can only see shifts at restaurants where they're verified
CREATE POLICY "Servers see verified restaurant shifts"
  ON public.shifts FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.verifications
      WHERE user_id = auth.uid()
      AND status IN ('verified', 'guest')
    )
    OR posted_by = auth.uid()
    OR claimed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = shifts.restaurant_id
      AND manager_id = auth.uid()
    )
  );

-- Only verified servers can post shifts
CREATE POLICY "Verified servers can post"
  ON public.shifts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.verifications
      WHERE user_id = auth.uid()
      AND restaurant_id = shifts.restaurant_id
      AND status = 'verified'
    )
    AND posted_by = auth.uid()
  );

-- Users can claim shifts they're eligible for
CREATE POLICY "Verified servers can claim shifts"
  ON public.shifts FOR UPDATE
  USING (
    status = 'open'
    AND restaurant_id IN (
      SELECT restaurant_id FROM public.verifications
      WHERE user_id = auth.uid()
      AND status IN ('verified', 'guest')
    )
  )
  WITH CHECK (
    (status = 'claimed' AND claimed_by = auth.uid())
    OR status = shifts.status
  );

-- Only restaurant managers can approve/deny
CREATE POLICY "Managers approve shifts"
  ON public.shifts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = shifts.restaurant_id
      AND manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = shifts.restaurant_id
      AND manager_id = auth.uid()
    )
  );

-- Users can update their own posted shifts (before claimed)
CREATE POLICY "Users can update own posted shifts"
  ON public.shifts FOR UPDATE
  USING (posted_by = auth.uid() AND status = 'open')
  WITH CHECK (posted_by = auth.uid());

-- Notifications policies
-- Users can only see their own notifications
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications (via Edge Functions with service role)
-- This requires service role key, handled in Edge Functions

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
