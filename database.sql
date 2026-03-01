-- Habit Tracker Database Schema
-- PostgreSQL schema for Supabase
-- This SQL creates all necessary tables with proper structure and constraints

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster queries
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- ============================================================
-- HABITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
  custom_days INTEGER[] DEFAULT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  start_date TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS habits_is_active_idx ON public.habits(is_active);
CREATE INDEX IF NOT EXISTS habits_user_active_idx ON public.habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON public.habits(created_at DESC);

-- ============================================================
-- HABIT CHECK-INS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habit_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'skipped', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for check-in queries
CREATE INDEX IF NOT EXISTS habit_checkins_habit_id_idx ON public.habit_checkins(habit_id);
CREATE INDEX IF NOT EXISTS habit_checkins_user_id_idx ON public.habit_checkins(user_id);
CREATE INDEX IF NOT EXISTS habit_checkins_checkin_date_idx ON public.habit_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS habit_checkins_user_habit_date_idx ON public.habit_checkins(user_id, habit_id, checkin_date);

-- ============================================================
-- UNIQUE CONSTRAINT: Only one check-in per day per habit
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS habit_checkins_unique_per_day 
  ON public.habit_checkins(habit_id, user_id, checkin_date);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update habit's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_habit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_updated_at();

-- Trigger for habits updated_at
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habit_updated_at();
