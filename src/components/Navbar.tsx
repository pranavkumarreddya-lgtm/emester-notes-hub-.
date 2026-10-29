'use client';

import React from 'react';
import {
  GraduationCap,
  Upload,
  User,
  Shield,
  FileCode2,
  ChevronDown,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentFriend: {
    id: string;
    name: string;
    email: string;
    isAuthorized: boolean;
  };
  isConfigured: boolean;
  onOpenUpload: () => void;
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

export function Navbar({
  currentFriend,
  isConfigured,
  onOpenUpload,
  onOpenAuth,
  onOpenSetup,
}: NavbarProps) {
  // Get initials
  const initials = currentFriend.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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
                  Open Access • No Login Needed
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
              title="View SQL Setup and RLS Policies"
            >
              <FileCode2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">SQL & Setup</span>
            </button>

            {/* Friend Profile Selector */}
            <button
              onClick={onOpenAuth}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-all cursor-pointer shadow-2xs group"
              title={isConfigured ? 'Account Details' : 'Switch Active Friend Profile'}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-800 leading-tight">
                    {currentFriend.name}
                  </span>
                  {currentFriend.isAuthorized && (
                    <Shield className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 leading-tight block">
                  {currentFriend.isAuthorized ? 'Member' : 'Guest (Read Only)'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
            </button>

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

