# Supabase Migration Guide

## Critical: Apply Database Migrations

Your Supabase project currently doesn't have the required tables. Follow these steps to apply all migrations.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the content from `supabase/migrations/COMBINED_MIGRATION.sql`
5. Click **Run** to execute all migrations at once

## Option 2: Execute Migrations One by One

If Option 1 fails, execute each migration file in order:

### Step 1: Create ENUM Types
File: `supabase/migrations/01_create_enums.sql`
```sql
CREATE TYPE public.affiliation AS ENUM ('Mil', 'KATUSA', 'Civilian');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE public.room_status AS ENUM ('recruiting', 'full', 'in_progress', 'completed');
```

### Step 2: Create Profiles Table
File: `supabase/migrations/02_create_profiles_table.sql`
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    affiliation public.affiliation,
    dod_id TEXT,
    verification_status public.verification_status DEFAULT 'unverified',
    id_card_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Create Rooms Table
File: `supabase/migrations/03_create_rooms_table.sql`
```sql
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    start_point TEXT,
    end_point TEXT,
    departure_time TIMESTAMPTZ,
    capacity INT DEFAULT 4,
    status public.room_status DEFAULT 'recruiting',
    host_id UUID REFERENCES public.profiles(id)
);
```

### Step 4: Create Room Members Table
File: `supabase/migrations/04_create_room_members_table.sql`
```sql
CREATE TABLE public.room_members (
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);
```

### Step 5: Enable RLS and Create Policies
File: `supabase/migrations/05_enable_rls.sql`
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Room members can view each other's profiles within that room"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT user_id FROM room_members WHERE room_id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
  )
);
```

### Step 6: Create Auto-Profile Trigger
File: `supabase/migrations/20240101000007_create_handle_new_user_function.sql`
```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone_number)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Option 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed and linked to your project:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Verification

After applying migrations, verify in your Supabase dashboard:

1. Go to **Table Editor**
2. Check that these tables exist:
   - `profiles`
   - `rooms`
   - `room_members`

3. Go to **Database** > **Policies**
4. Verify RLS policies are enabled for all three tables

5. Test the connection in your app by checking the error.txt issue is resolved

## Troubleshooting

**Error: type "public.affiliation" already exists**
- If you see this, some migrations were partially applied
- You can either:
  - Drop existing types/tables and re-run
  - Skip to the migration that failed and continue from there

**Error: relation already exists**
- This means the table was already created
- Continue with the next migration file

**RLS Policy Conflicts**
- If a policy already exists with the same name, you may need to drop it first:
  ```sql
  DROP POLICY IF EXISTS "policy_name" ON table_name;
  ```
