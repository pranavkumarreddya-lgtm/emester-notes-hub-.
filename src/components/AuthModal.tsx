'use client';

import React, { useState } from 'react';
import { MOCK_APPROVED_MEMBERS } from '../lib/mock-data';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import {
  X,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  currentFriend: {
    id: string;
    name: string;
    email: string;
    isAuthorized: boolean;
  };
  onSelectLocalFriend: (friend: { id: string; name: string; email: string; isAuthorized: boolean }) => void;
  onSupabaseAuthChange?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  isConfigured,
  currentFriend,
  onSelectLocalFriend,
  onSupabaseAuthChange,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSupabaseAuth = async (e: React.FormEvent) => {
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
        setMessage({ type: 'success', text: 'Successfully authenticated!' });
        onSupabaseAuthChange?.();
        // Full reload so the middleware picks up the new session cookies
        setTimeout(() => window.location.reload(), 800);
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
          text: 'Account created! Please check your email for confirmation or log in.',
        });
        onSupabaseAuthChange?.();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoading(false);
    onSupabaseAuthChange?.();
    onClose();
    // Redirect to login after sign-out so middleware picks up the cleared session
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isConfigured ? 'Supabase Authentication' : 'Account & Demo Switcher'}
              </h3>
              <p className="text-xs text-slate-500">
                Access & account management
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

        <div className="p-6 space-y-5">
          {/* Active Profile Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentFriend.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{currentFriend.name}</span>
                  {currentFriend.isAuthorized ? (
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Authorized
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-200 text-slate-600">
                      Guest
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">{currentFriend.email}</p>
              </div>
            </div>

            {isConfigured && (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            )}
          </div>

          {/* If Supabase is configured, show real Supabase Auth form */}
          {isConfigured ? (
            <div>
              <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setMessage(null);
                  }}
                  className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
                    authMode === 'signin'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
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
                  className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
                    authMode === 'signup'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2 ${
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

              <form onSubmit={handleSupabaseAuth} className="space-y-3 text-xs">
                {authMode === 'signup' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    College Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="friend@college.edu"
                      required
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{authMode === 'signin' ? 'Sign In to Hub' : 'Register Account'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Local Vault Mode: Instant Switcher between Demo Profiles */
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Demo Member Profiles</span>
                </span>
                <span className="text-[11px] text-slate-400">Click to switch</span>
              </div>

              <div className="space-y-2">
                {MOCK_APPROVED_MEMBERS.map((friend) => {
                  const isCurrent = currentFriend.email === friend.email;

                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => {
                        onSelectLocalFriend({
                          id: friend.user_id || friend.id,
                          name: friend.display_name,
                          email: friend.email,
                          isAuthorized: true,
                        });
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {friend.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {friend.display_name}
                          </p>
                          <p className="text-[11px] text-slate-500">{friend.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {isCurrent ? 'Active Now' : 'Switch'}
                      </span>
                    </button>
                  );
                })}

                {/* Guest Viewer option to test authorization guards */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocalFriend({
                      id: 'guest-visitor',
                      name: 'Guest Viewer',
                      email: 'guest@external.edu',
                      isAuthorized: false,
                    });
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    !currentFriend.isAuthorized
                      ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-400'
                      : 'border-dashed border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Test as Unauthorized Guest</p>
                      <p className="text-[11px] text-slate-400">Verifies read-only permission guard</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {!currentFriend.isAuthorized ? 'Active' : 'Test'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Security policy note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Row Level Security (RLS) Guarantee</span>
            </p>
            <p>
              Any registered student can view and upload semester materials. Each member can only delete or edit materials they personally uploaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

