-- Add INSERT policy for rooms table
-- Authenticated users can create rooms

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert into room_members
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms"
ON public.room_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view room members
DROP POLICY IF EXISTS "Authenticated users can view room members" ON public.room_members;
CREATE POLICY "Authenticated users can view room members"
ON public.room_members FOR SELECT
TO authenticated
USING (true);
