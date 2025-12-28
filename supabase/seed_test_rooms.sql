-- Test Room Seeding SQL
-- Run this in Supabase SQL Editor to create sample rooms

INSERT INTO public.rooms (start_point, end_point, departure_time, capacity, status)
VALUES
  ('Pyeongtaek Station', 'Walking Gate', NOW() + INTERVAL '2 hours', 4, 'recruiting'),
  ('Walking Gate', 'Pyeongtaek Station', NOW() + INTERVAL '4 hours', 3, 'recruiting'),
  ('CPX', 'Pyeongtaek Station', NOW() + INTERVAL '6 hours', 4, 'recruiting'),
  ('Pyeongtaek Station', 'CPX', NOW() + INTERVAL '8 hours', 4, 'recruiting'),
  ('Walking Gate', 'CPX', NOW() + INTERVAL '10 hours', 3, 'recruiting');

-- Verify insertion
SELECT id, start_point, end_point, departure_time, capacity, status, created_at
FROM public.rooms
WHERE status = 'recruiting'
ORDER BY departure_time;
