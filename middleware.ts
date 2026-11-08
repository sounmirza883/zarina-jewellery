import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY, supabaseConfigured } from '@/lib/supabase/config';

// Keeps Supabase sessions fresh on /admin and /account, and sends signed-out visitors from /account
// to the login page. Data access control itself lives in Row Level Security.
export async function middleware(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Responses that carry auth cookies must never be cached by a CDN.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getUser();

  if (!data.user && request.nextUrl.pathname.startsWith('/account')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    const redirect = NextResponse.redirect(url);
    redirect.headers.set('Cache-Control', 'private, no-store');
    // Keep any cookies the refresh attempt just cleared or set.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = { matcher: ['/admin/:path*', '/account/:path*'] };
