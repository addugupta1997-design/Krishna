import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(user && supabase));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data ?? { id: user.id, full_name: null, phone: null });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (updates: Partial<Pick<Profile, 'full_name' | 'phone'>>) => {
      if (!supabase || !user) return false;
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates }, { onConflict: 'id' });
      setSaving(false);
      if (!error) setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      return !error;
    },
    [user],
  );

  return { profile, loading, saving, save, reload: load };
}
