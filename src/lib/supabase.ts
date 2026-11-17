import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Null when env vars are missing so the storefront still renders without sign-in.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// Avoid sending the user to a raw JSON error page when a provider is disabled in the dashboard.
export async function isProviderEnabled(provider: string): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!response.ok) return false;
    const settings = await response.json();
    return Boolean(settings?.external?.[provider]);
  } catch {
    return false;
  }
}
