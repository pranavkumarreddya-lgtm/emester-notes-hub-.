'use client';

import React, { useState } from 'react';
import {
  X,
  FileCode2,
  Copy,
  Check,
  Database,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_MIGRATION_TEXT = `-- ==============================================================================
-- Semester Notes Hub - Complete Database Schema & Storage Security Policies
-- Designed for exactly three approved friends
-- ==============================================================================

-- 1. Approved Members Table
CREATE TABLE IF NOT EXISTS public.approved_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on approved_members
ALTER TABLE public.approved_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view approved roster" ON public.approved_members;
CREATE POLICY "Allow authenticated to view approved roster"
    ON public.approved_members
    FOR SELECT
    TO authenticated
    USING (true);

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

CREATE INDEX IF NOT EXISTS idx_materials_subject_category ON public.materials(subject, category);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_uploader_id ON public.materials(uploader_id);
CREATE INDEX IF NOT EXISTS idx_materials_unit ON public.materials(unit);

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
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.approved_members TO authenticated;
GRANT ALL ON public.materials TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_member() TO authenticated;

-- Seed the 3 authorized friends:
-- Replace these emails with your actual college emails in the Supabase Table Editor or directly below
INSERT INTO public.approved_members (email, display_name)
VALUES
    ('alex@college.edu', 'Alex Rivera'),
    ('sam@college.edu', 'Sam Chen'),
    ('jordan@college.edu', 'Jordan Patel')
ON CONFLICT (email) DO NOTHING;`;

export function SqlSetupModal({ isOpen, onClose }: SqlSetupModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supabase PostgreSQL & Storage Setup
              </h3>
              <p className="text-xs text-slate-500">
                Complete SQL schema, RLS policies & setup instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Quick steps */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>4-Step Quick Setup</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed font-medium">
              <li>
                Create a free project on{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline font-semibold"
                >
                  Supabase
                </a>
                .
              </li>
              <li>
                Open the <strong>SQL Editor</strong> tab in your Supabase dashboard.
              </li>
              <li>
                Paste the SQL script below and click <strong>Run</strong>.
              </li>
              <li>
                Copy your <strong>Project URL</strong> and <strong>Anon Key</strong> into{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-indigo-900">
                  .env.local
                </code>
                .
              </li>
            </ol>
          </div>

          {/* Security Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Security Best Practice:</strong> Never expose your{' '}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> in frontend code or client environment variables.
              Use only <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </div>
          </div>

          {/* Code block with copy button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-slate-500" />
                <span>supabase/migrations/20240101000000_semester_notes_schema.sql</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full SQL Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-72 border border-slate-800 selection:bg-indigo-500">
              <code>{SQL_MIGRATION_TEXT}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

