CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    start_point TEXT,
    end_point TEXT,
    departure_time TIMESTAMPTZ,
    capacity INT DEFAULT 4,
    status public.room_status DEFAULT 'recruiting',
    host_id UUID REFERENCES public.profiles(id)
);