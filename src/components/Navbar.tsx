'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  ChevronDown,
  Upload,
  Search,
  Menu,
  X,
  BookOpen,
  MessageSquareCode,
  BarChart3,
  Binary,
  Workflow,
  Network,
  FolderGit2,
  Bookmark,
} from 'lucide-react';
import { SUBJECTS } from '../lib/constants';
import { SubjectCode } from '../lib/types';

interface NavbarProps {
  onOpenUpload: () => void;
  onSearchClick?: () => void;
}

export function Navbar({ onOpenUpload, onSearchClick }: NavbarProps) {
  const pathname = usePathname();
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subject icon helper
  const getSubjectIcon = (code: SubjectCode) => {
    switch (code) {
      case 'NLP':
        return <MessageSquareCode className="w-4 h-4 text-purple-600" />;
      case 'DA':
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
      case 'DAA':
        return <Binary className="w-4 h-4 text-emerald-600" />;
      case 'DEVOPS':
        return <Workflow className="w-4 h-4 text-amber-600" />;
      case 'CN':
        return <Network className="w-4 h-4 text-cyan-600" />;
    }
  };

  const isHome = pathname === '/';
  const isSubjectPage = pathname.startsWith('/subjects/');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                Semester Notes Hub
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Academic Knowledge Vault
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Home Link */}
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${
                isHome
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Subjects Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsSubjectsOpen(true)}
              onMouseLeave={() => setIsSubjectsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                  isSubjectPage
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Subjects</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isSubjectsOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Subjects Dropdown Menu */}
              {isSubjectsOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    5 Core Semester Subjects
                  </div>
                  <div className="space-y-1">
                    {SUBJECTS.map((sub) => {
                      const isActive = pathname === `/subjects/${sub.slug}`;
                      return (
                        <Link
                          key={sub.code}
                          href={`/subjects/${sub.slug}`}
                          onClick={() => setIsSubjectsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${sub.iconBg}`}>
                            {getSubjectIcon(sub.code)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {sub.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {sub.fullName}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Community Vault Link */}
            <Link
              href="/#subjects"
              className="px-4 py-2 rounded-full text-xs lg:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Community Vault
            </Link>

            {/* Upload Notes Nav Link */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-full text-xs lg:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Upload Notes
            </button>
          </nav>

          {/* Right Header Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Search Button */}
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className="p-2.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Search materials"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Primary Action Button: Upload Notes CTA */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs lg:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>

            {/* User Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-inner">
              🎓
            </div>
          </div>

          {/* Mobile Right Controls: Upload CTA & Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Full Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                isHome ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Home</span>
            </Link>

            <div className="pt-2">
              <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Browse by Subject
              </p>
              <div className="grid grid-cols-1 gap-1">
                {SUBJECTS.map((sub) => (
                  <Link
                    key={sub.code}
                    href={`/subjects/${sub.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-blue-50"
                  >
                    <div className={`p-1.5 rounded-lg ${sub.iconBg}`}>
                      {getSubjectIcon(sub.code)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{sub.code}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {sub.fullName}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/#subjects"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <span>Community Vault</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenUpload();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Semester Material</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
