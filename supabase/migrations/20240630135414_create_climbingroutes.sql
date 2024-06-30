-- Create the climbingroutes table
CREATE TABLE public.climbingroutes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    difficulty smallint NULL,
    difficulty_sign boolean NULL,
    location character varying NULL,
    type character varying NULL,
    comment text NULL,
    creator json NULL,
    archived boolean NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    color character varying NULL,
    screw_date timestamp with time zone NULL,
    CONSTRAINT climbingroutes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Enable real-time on the climbingroutes table
BEGIN;
ALTER PUBLICATION supabase_realtime ADD TABLE public.climbingroutes;
COMMIT;

-- Enable Row Level Security (RLS) on the climbingroutes table
ALTER TABLE public.climbingroutes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users
CREATE POLICY "Enable read access for all users"
    ON public.climbingroutes
    AS PERMISSIVE
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Policy with security definer functions"
    ON public.climbingroutes
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);
