import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv, isSupabaseConfigured } from './config';

export { isSupabaseConfigured, getSupabaseEnv };

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js 15 & 16, cookies() is asynchronous and must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Safely fetches the authenticated user on the server.
 * Always uses supabase.auth.getUser() to validate the token against the Supabase Auth server,
 * avoiding the security pitfalls of getSession().
 */
export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error('Error fetching authenticated user on server:', err);
    return null;
  }
}

/**
 * Helper to fetch approved member status for the current user from public.approved_members
 */
export async function getCurrentApprovedMember() {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: member } = await supabase
      .from('approved_members')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
      .maybeSingle();

    return member || null;
  } catch (err) {
    console.error('Error fetching approved member on server:', err);
    return null;
  }
}
