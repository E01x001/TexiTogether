-- ============================================
-- TEXITOGETHER SAFE DATABASE MIGRATION
-- ============================================
-- This migration safely creates all required objects
-- using IF NOT EXISTS and conditional logic

-- ============================================
-- STEP 1: Create ENUM Types (conditionally)
-- ============================================

DO $$ BEGIN
    CREATE TYPE public.affiliation AS ENUM ('Mil', 'KATUSA', 'Civilian');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.room_status AS ENUM ('recruiting', 'full', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Create Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    affiliation public.affiliation,
    dod_id TEXT,
    verification_status public.verification_status DEFAULT 'unverified',
    id_card_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create Rooms Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    start_point TEXT,
    end_point TEXT,
    departure_time TIMESTAMPTZ,
    capacity INT DEFAULT 4,
    status public.room_status DEFAULT 'recruiting',
    host_id UUID REFERENCES public.profiles(id)
);

-- ============================================
-- STEP 4: Create Room Members Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.room_members (
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- ============================================
-- STEP 5: Enable Row Level Security
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS Policies (drop if exists first)
-- ============================================

DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
CREATE POLICY "Users can select their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;
CREATE POLICY "Authenticated users can view all rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Room members can view each other's profiles within that room" ON public.profiles;
CREATE POLICY "Room members can view each other's profiles within that room"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT user_id FROM room_members WHERE room_id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- STEP 7: Create Auto-Profile Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number)
  VALUES (new.id, new.phone);
  RETURN new;
END;
$$;

-- ============================================
-- STEP 8: Create Trigger on Auth User Creation
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
