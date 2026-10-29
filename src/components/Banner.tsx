'use client';

import React from 'react';
import { Database, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface BannerProps {
  isConfigured: boolean;
  onOpenSetup: () => void;
}

export function Banner({ isConfigured, onOpenSetup }: BannerProps) {
  if (isConfigured) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-emerald-900 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Supabase Cloud Storage Active</span>
            <span className="hidden sm:inline-block text-emerald-400">•</span>
            <span className="hidden sm:inline-block text-emerald-700 text-xs font-normal">
              Row Level Security & Private Bucket Enforced
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>3 Authorized Friends Vault</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-b border-amber-200/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 text-amber-950 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-900">Local Vault Demo Mode:</strong>{' '}
            Running with placeholder credentials. Materials persist locally in your browser session.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>Supabase Setup Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

