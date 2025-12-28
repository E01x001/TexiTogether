-- Join Room RPC Function
-- Allows users to join a room if it's not full and they're not already a member

CREATE OR REPLACE FUNCTION public.join_room(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_capacity INT;
  v_current_count INT;
  v_already_member BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to join a room';
  END IF;

  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RAISE EXCEPTION 'You are already a member of this room';
  END IF;

  -- Get room capacity
  SELECT capacity INTO v_capacity
  FROM public.rooms
  WHERE id = p_room_id;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Get current member count
  SELECT COUNT(*) INTO v_current_count
  FROM public.room_members
  WHERE room_id = p_room_id;

  -- Check if room is full
  IF v_current_count >= v_capacity THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Add user to room_members
  INSERT INTO public.room_members (room_id, user_id)
  VALUES (p_room_id, v_user_id);

  -- Update room status to 'full' if capacity is reached
  IF v_current_count + 1 >= v_capacity THEN
    UPDATE public.rooms
    SET status = 'full'
    WHERE id = p_room_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined the room'
  );
END;
$$;

-- Leave Room RPC Function
-- Allows users to leave a room they're a member of

CREATE OR REPLACE FUNCTION public.leave_room(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN;
  v_capacity INT;
  v_new_count INT;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to leave a room';
  END IF;

  -- Check if user is a member
  SELECT EXISTS(
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'You are not a member of this room';
  END IF;

  -- Remove user from room_members
  DELETE FROM public.room_members
  WHERE room_id = p_room_id AND user_id = v_user_id;

  -- Get room capacity and new member count
  SELECT capacity INTO v_capacity
  FROM public.rooms
  WHERE id = p_room_id;

  SELECT COUNT(*) INTO v_new_count
  FROM public.room_members
  WHERE room_id = p_room_id;

  -- Update room status back to 'recruiting' if it was full
  IF v_new_count < v_capacity THEN
    UPDATE public.rooms
    SET status = 'recruiting'
    WHERE id = p_room_id AND status = 'full';
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully left the room'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.join_room TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_room TO authenticated;
