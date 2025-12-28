-- Create RPC function for room creation
-- This function creates a room and automatically adds the host to room_members

CREATE OR REPLACE FUNCTION public.create_room(
  p_start_point TEXT,
  p_end_point TEXT,
  p_departure_time TIMESTAMPTZ,
  p_capacity INT DEFAULT 4
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a room';
  END IF;

  -- Create the room
  INSERT INTO public.rooms (
    start_point,
    end_point,
    departure_time,
    capacity,
    status,
    host_id
  )
  VALUES (
    p_start_point,
    p_end_point,
    p_departure_time,
    p_capacity,
    'recruiting',
    v_user_id
  )
  RETURNING id INTO v_room_id;

  -- Add the host to room_members
  INSERT INTO public.room_members (room_id, user_id)
  VALUES (v_room_id, v_user_id);

  RETURN v_room_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_room TO authenticated;
