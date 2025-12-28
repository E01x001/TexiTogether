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