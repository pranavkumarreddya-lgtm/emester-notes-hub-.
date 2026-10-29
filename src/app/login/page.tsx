'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap,
  LogIn,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  BookOpen,
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

        setMessage({ type: 'success', text: 'Signed in! Redirecting…' });

        // Redirect to the page they were trying to access, or home
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo') || '/';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 600);
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
          text: 'Account created! Check your email to confirm, then sign in.',
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

  // Check for error query param from auth callback
  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 px-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Semester Notes Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access the 3-Friend Study Vault
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setMessage(null);
              }}
              className={`flex-1 py-3.5 text-center cursor-pointer border-b-2 transition-all ${
                authMode === 'signin'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setMessage(null);
              }}
              className={`flex-1 py-3.5 text-center cursor-pointer border-b-2 transition-all ${
                authMode === 'signup'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* URL error from auth callback */}
            {urlError && !message && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-start gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{decodeURIComponent(urlError)}</span>
              </div>
            )}

            {/* Status message */}
            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  message.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4 text-sm">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@college.edu"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {authMode === 'signin'
                        ? 'Sign In to Hub'
                        : 'Create Account'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Security footer note */}
        <div className="mt-6 p-4 rounded-xl bg-white/60 border border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>
              Protected by Supabase Auth &amp; PostgreSQL Row Level Security
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Only emails in the <code className="text-slate-500">approved_members</code> table can upload or delete materials.
          </p>
        </div>
      </div>
    </div>
  );
}

