'use client';

import React from 'react';
import {
  GraduationCap,
  Upload,
  FileCode2,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenSetup: () => void;
}

export function Navbar({
  onOpenUpload,
  onOpenSetup,
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Semester Notes Hub
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  Open Vault • No Login Required
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Open academic repository for NLP, DA, DAA, DEVOPS & CN
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Setup Guide Button */}
            <button
              onClick={onOpenSetup}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="View SQL Setup and Instructions"
            >
              <FileCode2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">SQL & Setup</span>
            </button>

            {/* Public Community Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Public Access</span>
            </div>

            {/* Upload Material CTA - Always Enabled */}
            <button
              onClick={onOpenUpload}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 active:scale-95"
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
