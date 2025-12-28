-- TEMPORARY: Allow anon users to insert rooms for testing
-- TODO: Remove this in production

DROP POLICY IF EXISTS "Allow anon insert for testing" ON public.rooms;
CREATE POLICY "Allow anon insert for testing"
ON public.rooms FOR INSERT
TO anon
WITH CHECK (true);
