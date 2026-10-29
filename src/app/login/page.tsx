'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap,
  LogIn,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        setMessage({ type: 'success', text: 'Signed in successfully! Redirecting…' });

        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo') || '/';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
            },
          },
        });
        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Account created! Please check your email inbox to confirm, or sign in directly.',
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-hidden selection:bg-violet-500 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-cyan-500/25 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-md my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 text-white shadow-2xl">
              <GraduationCap className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Open Community Study Hub</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Semester Notes Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm">
            Sign in to upload, share, and access curated notes for NLP, DA, DAA, DEVOPS & CN.
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-2xl shadow-indigo-950/50 overflow-hidden">
          {/* Top highlight bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />

          {/* Segmented Mode Selector */}
          <div className="p-5 pb-0">
            <div className="flex p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Redirect Error Notification */}
            {urlError && !message && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs flex items-start gap-2.5 text-rose-300 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{decodeURIComponent(urlError)}</span>
              </div>
            )}

            {/* In-Form Message */}
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  message.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4 text-xs sm:text-sm">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu or gmail.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === 'signin' ? 'Sign In to Notes Hub' : 'Register & Join Hub'}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Perks Footer inside card */}
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free to upload & read</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Auth Secured</span>
            </span>
          </div>
        </div>

        {/* Bottom helper text */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Anyone can register with any email address to start sharing notes.
        </p>
      </div>
    </div>
  );
}
