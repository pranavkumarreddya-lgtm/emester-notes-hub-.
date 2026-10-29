import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv, isSupabaseConfigured } from './config';

export { isSupabaseConfigured, getSupabaseEnv };

/**
 * Creates a Supabase client for client-side components (browser).
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
