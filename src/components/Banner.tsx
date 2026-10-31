'use client';

import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface BannerProps {
  isConfigured: boolean;
  onOpenSetup: () => void;
}

export function Banner({ isConfigured, onOpenSetup }: BannerProps) {
  // When Supabase is configured and active, keep the header clean with no banners
  if (isConfigured) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-b border-amber-200/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 text-amber-950 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-900">Local Demo Mode:</strong>{' '}
            Materials persist in your browser session.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>Setup Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
