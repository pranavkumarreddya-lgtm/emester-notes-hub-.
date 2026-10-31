'use client';

import React from 'react';
import {
  GraduationCap,
  Upload,
} from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenSetup?: () => void;
}

export function Navbar({
  onOpenUpload,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Semester Notes Hub
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">
                Open academic repository for NLP, DA, DAA, DEVOPS & CN
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Material CTA */}
            <button
              onClick={onOpenUpload}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
