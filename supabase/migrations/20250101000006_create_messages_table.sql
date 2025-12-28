-- Create Messages Table for In-Room Chat
-- Stores all chat messages sent within rooms

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Room members can view messages in their rooms
CREATE POLICY "Room members can view messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_members.room_id = messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- RLS Policy: Room members can insert messages in their rooms
CREATE POLICY "Room members can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_members.room_id = messages.room_id
    AND room_members.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Indexes for better query performance
CREATE INDEX messages_room_id_idx ON public.messages(room_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON public.messages TO authenticated;
