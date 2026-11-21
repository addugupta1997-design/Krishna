import React, { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthForm, type AuthMode } from './AuthForm';

interface AuthDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  initialError?: string;
}

export function AuthDialog({ open, user, onClose, initialError }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

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
        <h2 id="auth-dialog-title" className="sr-only">
          {user ? 'Your account' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>
        <AuthForm
          user={user}
          mode={mode}
          onModeChange={setMode}
          onSuccess={onClose}
          initialError={initialError}
          onClose={onClose}
          focusOnMount
        />
      </div>
    </div>
  );
}
