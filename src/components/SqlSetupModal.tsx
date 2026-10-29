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
-- Semester Notes Hub - Public Schema & Storage Policies (No Login Required)
-- Allows any student to view, download, and upload semester materials directly.
-- ==============================================================================

-- 1. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL CHECK (subject IN ('NLP', 'DA', 'DAA', 'DEVOPS', 'CN')),
    category TEXT NOT NULL CHECK (category IN ('PDF Notes', 'Photos', 'Previous Year Question Papers')),
    unit TEXT CHECK (unit IS NULL OR unit IN ('Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5')),
    uploader_id UUID,
    uploader_name TEXT NOT NULL DEFAULT 'Student',
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remove foreign key constraint if existing from earlier migration
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_uploader_id_fkey;
ALTER TABLE public.materials ALTER COLUMN uploader_id DROP NOT NULL;

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_materials_subject_category ON public.materials(subject, category);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_unit ON public.materials(unit);

-- Enable RLS and grant public access to anon and authenticated roles
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.materials TO anon, authenticated;

-- Policies on materials: Allow public read, insert, update, and delete
DROP POLICY IF EXISTS "Public can view materials" ON public.materials;
CREATE POLICY "Public can view materials"
    ON public.materials FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public can insert materials" ON public.materials;
CREATE POLICY "Public can insert materials"
    ON public.materials FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update materials" ON public.materials;
CREATE POLICY "Public can update materials"
    ON public.materials FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete materials" ON public.materials;
CREATE POLICY "Public can delete materials"
    ON public.materials FOR DELETE
    TO anon, authenticated
    USING (true);


-- 2. Storage Bucket: Public 'study-materials'
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

-- Storage Policies: Public can download, upload, and delete
DROP POLICY IF EXISTS "Public can access study materials" ON storage.objects;
CREATE POLICY "Public can access study materials"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public can upload study materials" ON storage.objects;
CREATE POLICY "Public can upload study materials"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public can delete study materials" ON storage.objects;
CREATE POLICY "Public can delete study materials"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'study-materials');`;

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

