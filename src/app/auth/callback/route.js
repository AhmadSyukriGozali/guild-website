import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    const errorDescription =
      requestUrl.searchParams.get('error_description') ||
      requestUrl.searchParams.get('error') ||
      'Kode autentikasi tidak ditemukan.';

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  const cookieStore = await cookies();

  const response = NextResponse.redirect(
    `${requestUrl.origin}/dashboard`
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    console.error(
      'OAuth callback gagal:',
      error?.message || 'User tidak ditemukan'
    );

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        error?.message || 'Login gagal'
      )}`
    );
  }

  const username =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    username;

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    '';

  const provider =
    user.app_metadata?.provider ||
    'email';

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email || null,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        provider,
        role: 'guest',
        status: 'guest',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      }
    );

  if (profileError) {
    console.error(
      'Gagal membuat profile:',
      profileError.message
    );

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        'Login berhasil, tetapi profile gagal dibuat.'
      )}`
    );
  }

  return response;
}