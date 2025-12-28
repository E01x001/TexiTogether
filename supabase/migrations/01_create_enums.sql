CREATE TYPE public.affiliation AS ENUM (
    'Mil',
    'KATUSA',
    'Civilian'
);

CREATE TYPE public.verification_status AS ENUM (
    'unverified',
    'pending',
    'verified'
);

CREATE TYPE public.room_status AS ENUM (
    'recruiting',
    'full',
    'in_progress',
    'completed'
);