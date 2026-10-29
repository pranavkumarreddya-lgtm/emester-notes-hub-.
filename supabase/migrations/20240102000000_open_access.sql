-- ==============================================================================
-- Migration: Open Access for All Authenticated Users
-- Allows anyone who signs up to view, download, and upload semester materials.
-- Users can only edit or delete materials they personally uploaded.
-- ==============================================================================

-- 1. Update Materials Table RLS Policies
DROP POLICY IF EXISTS "Approved members can view materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
CREATE POLICY "Authenticated users can view materials"
    ON public.materials
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Approved members can insert their own materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can insert their own materials" ON public.materials;
CREATE POLICY "Authenticated users can insert their own materials"
    ON public.materials
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
CREATE POLICY "Users can update their own materials"
    ON public.materials
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;
CREATE POLICY "Users can delete their own materials"
    ON public.materials
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploader_id);


-- 2. Update Storage RLS Policies for 'study-materials' Bucket
DROP POLICY IF EXISTS "Approved members can access study materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access study materials" ON storage.objects;
CREATE POLICY "Authenticated users can access study materials"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Approved members can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own files" ON storage.objects;
CREATE POLICY "Authenticated users can upload their own files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'study-materials' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'study-materials' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

