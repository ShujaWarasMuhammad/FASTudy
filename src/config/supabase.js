import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * When Supabase env vars are missing (e.g. a quick demo deploy) the app still runs
 * in local mode: bundled question bank + guest progress in localStorage.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured; running in local mode (guest progress only).');
}

export const supabase = createClient(
  SUPABASE_URL || 'http://localhost.invalid',
  SUPABASE_ANON_KEY || 'local-mode',
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
      flowType: 'pkce',
    },
  }
);
