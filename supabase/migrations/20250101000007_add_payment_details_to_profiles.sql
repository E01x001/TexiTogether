-- Add payment details columns to profiles table
-- These fields store payment information for settlement deep links

ALTER TABLE public.profiles
ADD COLUMN paypal_id TEXT,
ADD COLUMN toss_bank_name TEXT,
ADD COLUMN toss_account_no TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.paypal_id IS 'PayPal ID for payment deep links';
COMMENT ON COLUMN public.profiles.toss_bank_name IS 'Bank name for Toss payment deep links';
COMMENT ON COLUMN public.profiles.toss_account_no IS 'Account number for Toss payment deep links';
