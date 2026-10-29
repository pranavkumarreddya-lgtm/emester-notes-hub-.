'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
    canResend?: boolean;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setMessage({
              type: 'error',
              text: 'Email not confirmed yet. Click "Resend Confirmation" below, or confirm the user in your Supabase dashboard.',
              canResend: true,
            });
            return;
          }
          throw error;
        }

        setMessage({ type: 'success', text: 'Login successful! Redirecting…' });

        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo') || '/';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          // If "Confirm email" is disabled in Supabase, the user is signed in immediately
          setMessage({
            type: 'success',
            text: 'Account created and verified! Redirecting to hub…',
          });
          const params = new URLSearchParams(window.location.search);
          const redirectTo = params.get('redirectTo') || '/';
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 600);
        } else {
          // Email confirmation is required
          setMessage({
            type: 'success',
            text: 'Account created! Please check your email inbox to confirm, or click "Resend Confirmation" below.',
            canResend: true,
          });
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed.';
      const isUnconfirmed = errorMessage.toLowerCase().includes('email not confirmed');
      setMessage({
        type: 'error',
        text: errorMessage,
        canResend: isUnconfirmed,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your email above to resend confirmation.',
      });
      return;
    }

    setIsResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: `Confirmation link resent to ${email.trim()}! Please check your inbox and spam folder.`,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Failed to resend confirmation email.';
      setMessage({ type: 'error', text: errMessage });
    } finally {
      setIsResending(false);
    }
  };

  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070608] px-4 py-8 relative overflow-hidden font-sans select-none">
      {/* Subtle deep ambient glow behind card */}
      <div className="absolute w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Pinterest Card Container */}
      <div className="relative w-full max-w-[780px] min-h-[460px] bg-[#0f0e11] rounded-[26px] border-2 border-red-500/90 shadow-[0_0_35px_rgba(239,68,68,0.55),0_0_75px_rgba(220,38,38,0.25),inset_0_0_15px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col md:flex-row">
        
        {/* RIGHT DIAGONAL RED BANNER */}
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{
            clipPath: 'polygon(42% 0%, 100% 0%, 100% 100%, 73% 100%)',
            background:
              'linear-gradient(135deg, #f42846 0%, #dc143c 45%, #9b0c25 100%)',
          }}
        />

        {/* Diagonal Crisp Bright Seam Line */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-10"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line
            x1="42"
            y1="0"
            x2="73"
            y2="100"
            stroke="#ff385c"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Mobile Top Red Banner */}
        <div className="md:hidden w-full bg-gradient-to-r from-red-600 to-rose-800 p-6 text-center text-white border-b border-red-400/40">
          <h2 className="text-xl font-black uppercase tracking-wider">
            {authMode === 'signin' ? 'WELCOME BACK!' : 'HELLO, FRIEND!'}
          </h2>
          <p className="text-xs text-white/90 mt-1">
            {authMode === 'signin'
              ? 'Already a Member? Please Login.'
              : 'Create an account to access notes.'}
          </p>
        </div>

        {/* Desktop Right Banner Content */}
        <div className="hidden md:flex absolute top-0 right-0 w-[42%] h-full flex-col items-center justify-center text-center p-8 z-20 text-white">
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wide drop-shadow-sm leading-tight">
            {authMode === 'signin' ? 'WELCOME BACK!' : 'HELLO, FRIEND!'}
          </h2>
          <p className="text-xs lg:text-sm text-white/95 mt-2 font-medium drop-shadow-xs">
            {authMode === 'signin'
              ? 'Already a Member? Please Login.'
              : 'Create an account to access notes.'}
          </p>
        </div>

        {/* LEFT FORM SECTION */}
        <div className="relative z-20 w-full md:w-[50%] flex flex-col justify-center px-8 sm:px-12 py-10">
          <h1 className="text-3xl font-extrabold text-white text-center mb-8 tracking-wide">
            {authMode === 'signin' ? 'Login' : 'Register'}
          </h1>

          {/* Error / Status Messages */}
          {urlError && !message && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-[11px] text-red-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{decodeURIComponent(urlError)}</span>
            </div>
          )}

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs space-y-2 ${
                message.type === 'error'
                  ? 'bg-red-950/90 border border-red-500/50 text-red-200'
                  : 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>

              {message.canResend && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-white transition-colors cursor-pointer"
                >
                  {isResending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>Resend Confirmation Email</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <div className="relative border-b border-white/50 focus-within:border-red-500 transition-colors py-1.5 flex items-center gap-3">
                <User className="w-4 h-4 text-white/80 shrink-0" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
                />
              </div>
            )}

            {/* Email / Username Input */}
            <div className="relative border-b border-white/50 focus-within:border-red-500 transition-colors py-1.5 flex items-center gap-3">
              <User className="w-4 h-4 text-white/80 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or Email"
                required
                className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
              />
            </div>

            {/* Password Input */}
            <div className="relative border-b border-white/50 focus-within:border-red-500 transition-colors py-1.5 flex items-center gap-3">
              <Lock className="w-4 h-4 text-white/80 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
              />
            </div>

            {/* Glossy Red Pill Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-full font-bold text-white text-sm tracking-wide cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background:
                  'linear-gradient(180deg, #ff234a 0%, #cf1132 50%, #990a22 100%)',
                boxShadow:
                  '0 4px 18px rgba(255, 35, 74, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing…</span>
                </div>
              ) : authMode === 'signin' ? (
                'Login'
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Bottom Links */}
          <div className="mt-5 text-center text-xs text-white/80 space-y-1">
            {authMode === 'signin' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setMessage(null);
                  }}
                  className="text-red-500 hover:text-red-400 font-semibold cursor-pointer hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setMessage(null);
                  }}
                  className="text-red-500 hover:text-red-400 font-semibold cursor-pointer hover:underline"
                >
                  Login
                </button>
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                alert('Password reset link will be sent to your email address.');
              }}
              className="text-[11px] text-white/50 hover:text-white/80 transition-colors cursor-pointer pt-1"
            >
              Forgot Password?
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
