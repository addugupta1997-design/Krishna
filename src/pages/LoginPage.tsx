import React, { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthStage } from '../components/AuthStage';
import { AuthForm, type AuthMode } from '../components/AuthForm';
import { useMascotMood } from '../components/ShyPeacock';
import { useCustomerAuth } from '../hooks/useCustomerAuth';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { user, oauthError } = useCustomerAuth();
  const [mode, setMode] = useState<AuthMode>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const mood = useMascotMood(password, visible);

  const handleSecretState = useCallback((nextPassword: string, nextVisible: boolean) => {
    setPassword(nextPassword);
    setVisible(nextVisible);
  }, []);

  const eyebrow = user
    ? 'Krishna Tracer · Your account'
    : mode === 'signin'
      ? 'Krishna Tracer · Sign in'
      : 'Krishna Tracer · Create account';
  const title = user ? 'Welcome back' : mode === 'signin' ? 'Welcome back' : 'Join the celebration';
  const subtitle = user
    ? 'Keep your details up to date, or sign out of this device.'
    : mode === 'signin'
      ? 'Sign in for a faster checkout and to keep your details ready.'
      : 'Create an account for a smoother checkout and to keep your details ready.';

  return (
    <AuthStage
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      mood={mood}
      footer={
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#682D42] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the Home
        </button>
      }
    >
      <AuthForm
        user={user}
        mode={mode}
        onModeChange={setMode}
        onSuccess={() => onNavigate('/')}
        initialError={oauthError}
        showHeader={false}
        focusOnMount
        onSecretState={handleSecretState}
      />
    </AuthStage>
  );
}
