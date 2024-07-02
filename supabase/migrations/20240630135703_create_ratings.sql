-- Create the ratings table
CREATE TABLE public.ratings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_id uuid NULL DEFAULT uuid_generate_v4(),
    rating smallint NULL,
    difficulty smallint NULL,
    difficulty_sign boolean NULL,
    comment text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT ratings_pkey PRIMARY KEY (id),
    CONSTRAINT public_ratings_route_id_fkey FOREIGN KEY (route_id)
        REFERENCES public.climbingroutes (id)
        ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable real-time on the ratings table
BEGIN;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
COMMIT;

-- Enable Row Level Security (RLS) on the ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users
CREATE POLICY "Enable read access for all users"
    ON public.ratings
    AS PERMISSIVE
    FOR SELECT
    TO PUBLIC
    USING (true);

--- Create policy to allow insert operations for all users
CREATE POLICY "Enable insert for all users"
    ON public.ratings
    AS PERMISSIVE
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

--- Create policy to allow update operations for authenticated users only
CREATE POLICY "Enable update for authenticated users only"
    ON public.ratings
    AS PERMISSIVE
    FOR UPDATE
    TO PUBLIC
    USING (auth.uid() IS NOT NULL);

--- Create policy to allow delete operations for authenticated users only
CREATE POLICY "Enable delete for authenticated users only"
    ON public.ratings
    AS PERMISSIVE
    FOR DELETE
    TO PUBLIC
    USING (auth.uid() IS NOT NULL);