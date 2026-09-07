import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Create a request client whose identity cannot follow shared session changes. */
export function createHistoryClient(accessToken) {
  if (!isSupabaseConfigured || !accessToken) throw new Error('History authentication is required');
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => accessToken,
  });
}

export default supabase;
