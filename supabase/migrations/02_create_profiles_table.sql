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