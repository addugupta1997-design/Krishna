import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const oauthParams = ['code', 'state', 'error', 'error_code', 'error_description'];

export function useCustomerAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(supabase));
  const [oauthError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('error_description') ?? params.get('error_code') ?? '';
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Drop OAuth params once Supabase has consumed the redirect code.
  useEffect(() => {
    if (loading) return;
    const url = new URL(window.location.href);
    if (!oauthParams.some((key) => url.searchParams.has(key))) return;
    oauthParams.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [loading]);

  return { session, user: session?.user ?? null, loading, oauthError };
}
