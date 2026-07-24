import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Middleware — Proteksi halaman yang butuh authentication.
 * Redirect ke /login jika user belum login.
 */
export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — akan otomatis set cookies jika perlu
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika tidak ada user, redirect ke /login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Daftar path yang perlu dilindungi
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tracker/:path*',
    '/looting/:path*',
    '/roster/:path*',
    '/admin/:path*',
  ],
};

