-- Habit Tracker Row Level Security (RLS) Policies
-- PostgreSQL RLS policies for Supabase
-- These policies ensure users can only access their own data

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (signed up via auth)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
CREATE POLICY "Users can create their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- HABITS TABLE POLICIES
-- ============================================================

-- Policy: Users can view their own habits
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits" ON public.habits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create habits for themselves
DROP POLICY IF EXISTS "Users can create their own habits" ON public.habits;
CREATE POLICY "Users can create their own habits" ON public.habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own habits
DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits" ON public.habits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own habits
DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits" ON public.habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- HABIT CHECK-INS TABLE POLICIES
-- ============================================================

-- Policy: Users can view their own check-ins
DROP POLICY IF EXISTS "Users can view their own checkins" ON public.habit_checkins;
CREATE POLICY "Users can view their own checkins" ON public.habit_checkins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create check-ins for their own habits
DROP POLICY IF EXISTS "Users can create checkins for their habits" ON public.habit_checkins;
CREATE POLICY "Users can create checkins for their habits" ON public.habit_checkins
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits 
      WHERE habits.id = habit_checkins.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own check-ins
DROP POLICY IF EXISTS "Users can update their own checkins" ON public.habit_checkins;
CREATE POLICY "Users can update their own checkins" ON public.habit_checkins
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own check-ins
DROP POLICY IF EXISTS "Users can delete their own checkins" ON public.habit_checkins;
CREATE POLICY "Users can delete their own checkins" ON public.habit_checkins
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- VERIFY RLS IS ENABLED
-- ============================================================

-- Check RLS status
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('users', 'habits', 'habit_checkins');
