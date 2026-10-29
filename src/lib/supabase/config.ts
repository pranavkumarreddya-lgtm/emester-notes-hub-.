/**
 * Supabase Configuration & Environment Helper
 *
 * Checks if live Supabase project credentials have been configured.
 * Supports modern NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as well as legacy NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isConfigured = Boolean(
    url.length > 0 &&
    anonKey.length > 0 &&
    !url.includes('placeholder.supabase.co') &&
    !anonKey.includes('placeholder-anon-key') &&
    !url.startsWith('https://your-project')
  );

  return {
    url: isConfigured ? url : (url || 'https://placeholder.supabase.co'),
    anonKey: isConfigured ? anonKey : (anonKey || 'placeholder-anon-key'),
    isConfigured,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().isConfigured;
}

