import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase, isProviderEnabled } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';

interface AuthDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  initialError?: string;
}

function friendlyError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes('provider is not enabled') || text.includes('unsupported provider')) {
    return 'Google sign-in is not switched on yet. Use email and password for now.';
  }
  if (text.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (text.includes('already registered')) return 'An account with this email already exists. Sign in instead.';
  if (text.includes('email not confirmed')) return 'Please confirm your email first â€” check your inbox for the link.';
  if (text.includes('rate limit') || text.includes('too many')) return 'Email sending limit reached. Please try again later.';
  if (text.includes('password')) return 'Password must be at least 8 characters.';
  return message;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function AuthDialog({ open, user, onClose, initialError }: AuthDialogProps) {
  const { profile, saving, save } = useProfile(user);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setError(initialError ? initialError.replace(/\+/g, ' ') : '');
    setNotice('');
    setShowPassword(false);
    emailRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose, initialError]);

  useEffect(() => {
    if (profile) setNameInput(profile.full_name ?? '');
  }, [profile]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError('Sign-in is not configured yet.');
      return;
    }
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const trimmedName = signupName.trim();
    if (mode === 'signup' && trimmedName.length < 2) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { full_name: trimmedName } },
        });
        if (signUpError) {
          setError(friendlyError(signUpError.message));
          return;
        }
        if (!data.session) {
          setNotice('Account created. Check your inbox for the confirmation link, then sign in.');
          setMode('signin');
        } else {
          setPassword('');
          setSignupName('');
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError(friendlyError(signInError.message));
          return;
        }
        if (data.session) {
          setPassword('');
          onClose();
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError('Sign-in is not configured yet.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const enabled = await isProviderEnabled('google');
    if (!enabled) {
      setError('Google sign-in is not switched on yet. Use email and password for now.');
      setBusy(false);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    if (oauthError) {
      setError(friendlyError(oauthError.message));
      setBusy(false);
    }
    // On success the browser redirects to Google, so there is nothing to clean up here.
  };

  const handleSaveName = async () => {
    const name = nameInput.trim() || null;
    const ok = await save({ full_name: name });
    if (ok && supabase) {
      // Keep Supabase Auth's user metadata in sync so the dashboard shows a display name.
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) console.error('Could not update display name:', error);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    await supabase?.auth.signOut();
    setBusy(false);
    setPassword('');
    onClose();
  };

  const inputClass =
    'w-full rounded-lg border border-[#B58A42]/50 bg-white px-3.5 py-2.5 text-sm text-[#352D2F] placeholder:text-[#352D2F]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#682D42] focus-visible:ring-offset-1';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#352D2F]/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#B58A42]/40 bg-[#FFF8EE] p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C6627]">
              Krishna Tracer
            </p>
            <h2 id="auth-dialog-title" className="mt-1 font-serif text-2xl font-bold text-[#682D42]">
              {user ? 'Your account' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-[#682D42] hover:bg-[#F6DCE3]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-[#352D2F]/80">
              Signed in as <span className="font-semibold text-[#682D42]">{user.email}</span>
            </p>
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-xs font-semibold text-[#682D42]">
                Your name
              </label>
              <div className="flex gap-2">
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Add your name"
                  className="w-full rounded-lg border border-[#B58A42]/50 bg-white px-3.5 py-2.5 text-sm text-[#352D2F] placeholder:text-[#352D2F]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#682D42] focus-visible:ring-offset-1"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={saving}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#B58A42]/70 px-3 text-xs font-semibold text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-lg bg-[#682D42] px-4 text-sm font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
              >
                Continue shopping
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#B58A42]/70 px-4 text-sm font-semibold text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#B58A42]/60 bg-white px-4 text-sm font-semibold text-[#352D2F] transition-colors hover:bg-[#F6DCE3]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#B58A42]/30" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#352D2F]/50">
              or
            </span>
            <span className="h-px flex-1 bg-[#B58A42]/30" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-signup-name" className="mb-1 block text-xs font-semibold text-[#682D42]">
                  Your name
                </label>
                <input
                  id="auth-signup-name"
                  type="text"
                  autoComplete="name"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  placeholder="e.g. Aditya Gupta"
                  className={inputClass}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold text-[#682D42]">
                Email
              </label>
              <input
                ref={emailRef}
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold text-[#682D42]">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  className={`${inputClass} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#682D42]/70 hover:bg-[#F6DCE3]/50 hover:text-[#682D42] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#B58A42]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div aria-live="polite" className="min-h-0">
              {error && (
                <p role="alert" className="rounded-lg bg-[#682D42]/10 px-3 py-2 text-xs font-medium text-[#682D42]">
                  {error}
                </p>
              )}
              {notice && (
                <p className="rounded-lg bg-[#B58A42]/15 px-3 py-2 text-xs font-medium text-[#8C6627]">
                  {notice}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#682D42] px-4 text-sm font-semibold text-[#FFF8EE] transition-colors hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <p className="pt-1 text-center text-xs text-[#352D2F]/70">
              {mode === 'signin' ? 'New to Krishna Tracer?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-semibold text-[#682D42] underline underline-offset-2 hover:text-[#4F1E30]"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </form>
          </>
        )}
      </div>
    </div>
  );
}

