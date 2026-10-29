-- ==============================================================================
-- Migration: Public Access Without Login
-- Allows all visitors to view, download, and upload semester materials
-- directly to Supabase without any authentication or login requirement.
-- ==============================================================================

-- 1. Modify materials table to remove auth.users requirement
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_uploader_id_fkey;
ALTER TABLE public.materials ALTER COLUMN uploader_id DROP NOT NULL;

-- 2. Grant schema and table permissions to public roles (anon and authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.materials TO anon, authenticated;

-- 3. Update Row Level Security Policies on materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;
DROP POLICY IF EXISTS "Approved members can view materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
CREATE POLICY "Public can view materials"
    ON public.materials FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Approved members can insert their own materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can insert their own materials" ON public.materials;
CREATE POLICY "Public can insert materials"
    ON public.materials FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
CREATE POLICY "Public can update materials"
    ON public.materials FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;
CREATE POLICY "Public can delete materials"
    ON public.materials FOR DELETE
    TO anon, authenticated
    USING (true);


-- 4. Update 'study-materials' Storage Bucket to be completely Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials',
    true,
    52428800, -- 50MB per file
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- 5. Storage RLS Policies: Allow public read, upload, and delete
DROP POLICY IF EXISTS "Public can access study materials" ON storage.objects;
DROP POLICY IF EXISTS "Approved members can access study materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access study materials" ON storage.objects;
CREATE POLICY "Public can access study materials"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public can upload study materials" ON storage.objects;
DROP POLICY IF EXISTS "Approved members can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own files" ON storage.objects;
CREATE POLICY "Public can upload study materials"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public can delete study materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Public can delete study materials"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'study-materials');

