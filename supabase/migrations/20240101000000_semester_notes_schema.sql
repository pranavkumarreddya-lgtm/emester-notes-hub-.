-- ==============================================================================
-- Semester Notes Hub - Complete Database Schema & Storage Security Policies
-- Designed for exactly three approved friends
-- ==============================================================================

-- 1. Approved Members Table
-- Controls authorization and ensures only the three designated friends have access.
-- No user can insert or elevate their own permissions through regular client APIs.
CREATE TABLE IF NOT EXISTS public.approved_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on approved_members
ALTER TABLE public.approved_members ENABLE ROW LEVEL SECURITY;

-- Approved or authenticated users can read the member roster (to display uploader names)
DROP POLICY IF EXISTS "Allow authenticated to view approved roster" ON public.approved_members;
CREATE POLICY "Allow authenticated to view approved roster"
    ON public.approved_members
    FOR SELECT
    TO authenticated
    USING (true);

-- No INSERT / UPDATE / DELETE policies for authenticated users!
-- Only the database owner/administrator or service role can configure members.

-- Helper function: Check if current authenticated user is an approved member
CREATE OR REPLACE FUNCTION public.is_approved_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.approved_members
    WHERE (approved_members.user_id = auth.uid())
       OR (lower(approved_members.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

-- Trigger to auto-associate auth.users(id) with approved_members when a user registers or logs in
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger AS $$
BEGIN
    UPDATE public.approved_members
    SET user_id = NEW.id
    WHERE lower(email) = lower(NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();


-- 2. Materials Table
-- Stores metadata for shared semester materials
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL CHECK (subject IN ('NLP', 'DA', 'DAA', 'DEVOPS', 'CN')),
    category TEXT NOT NULL CHECK (category IN ('PDF Notes', 'Photos', 'Important Questions')),
    unit TEXT CHECK (unit IS NULL OR unit IN ('Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5')),
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploader_name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast queries and filtering
CREATE INDEX IF NOT EXISTS idx_materials_subject_category ON public.materials(subject, category);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_uploader_id ON public.materials(uploader_id);
CREATE INDEX IF NOT EXISTS idx_materials_unit ON public.materials(unit);

-- Enable RLS on materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only approved members can view shared materials
DROP POLICY IF EXISTS "Approved members can view materials" ON public.materials;
CREATE POLICY "Approved members can view materials"
    ON public.materials
    FOR SELECT
    TO authenticated
    USING (public.is_approved_member());

-- Policy 2: Only approved members can insert their own materials
DROP POLICY IF EXISTS "Approved members can insert their own materials" ON public.materials;
CREATE POLICY "Approved members can insert their own materials"
    ON public.materials
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_approved_member() AND
        auth.uid() = uploader_id
    );

-- Policy 3: Users can only update their own materials
DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
CREATE POLICY "Users can update their own materials"
    ON public.materials
    FOR UPDATE
    TO authenticated
    USING (
        public.is_approved_member() AND
        auth.uid() = uploader_id
    )
    WITH CHECK (
        public.is_approved_member() AND
        auth.uid() = uploader_id
    );

-- Policy 4: Users can only delete their own materials
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;
CREATE POLICY "Users can delete their own materials"
    ON public.materials
    FOR DELETE
    TO authenticated
    USING (
        public.is_approved_member() AND
        auth.uid() = uploader_id
    );


-- 3. Storage Bucket & Policies
-- Create private 'study-materials' bucket with 10MB limit and restricted mime types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials',
    false,
    10485760, -- 10MB in bytes
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

-- Storage RLS: Approved members can download / generate signed URLs
DROP POLICY IF EXISTS "Approved members can access study materials" ON storage.objects;
CREATE POLICY "Approved members can access study materials"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'study-materials' AND
        public.is_approved_member()
    );

-- Storage RLS: Approved members can upload only into their own folder ({user_id}/*)
DROP POLICY IF EXISTS "Approved members can upload their own files" ON storage.objects;
CREATE POLICY "Approved members can upload their own files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'study-materials' AND
        public.is_approved_member() AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: Users can delete only their own uploaded files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'study-materials' AND
        public.is_approved_member() AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. Default Seed & Permissions
-- Grants required for authenticated users to interact with tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.approved_members TO authenticated;
GRANT ALL ON public.materials TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_member() TO authenticated;

-- Seed the 3 authorized friends:
-- Replace these emails with your actual college emails in the Supabase Table Editor or directly below
INSERT INTO public.approved_members (email, display_name)
VALUES
    ('hemanth@gmail.com', 'Hemanth'),
    ('kishore@gmail.com', 'Kishore'),
    ('nani@gmail.com', 'Nani')
ON CONFLICT (email) DO NOTHING;

