import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './config';

/**
 * Updates the user session and handles route protection.
 * Must be called in Next.js middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey, isConfigured } = getSupabaseEnv();

  // If Supabase credentials are not configured, allow request to pass through
  // so local demo mode and documentation setup work out of the box.
  if (!isConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing logic between createServerClient and supabase.auth.getUser().
  // Always use getUser() instead of getSession() for secure server validation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public routes that do not require authentication
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/sql-setup');

  // Define routes that require authentication
  // When live Supabase is configured, both the main vault (/) and protected subroutes (/protected, /upload, /dashboard) require authentication.
  const isProtected =
    pathname === '/' ||
    pathname.startsWith('/protected') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/upload');

  // 1. Unauthenticated user trying to access a protected route -> Redirect to /login
  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Preserve the original destination for post-login redirect
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Authenticated user visiting /login -> Redirect to dashboard/home or redirectTo
  if (user && pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/';
    const redirectUrl = new URL(redirectTo, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Return the original response with refreshed cookies
  return supabaseResponse;
}

