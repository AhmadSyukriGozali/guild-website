import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`);

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
            try {
              cookieStore.set(name, value, options);
            } catch {}
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
  }

  const userId = data.session?.user?.id;

  if (userId) {
    const user = data.session.user;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        username:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        email: user.email || '',
        provider: user.app_metadata?.provider || 'email',
        role: 'guest',
        status: 'guest',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Auto-create profile error:', insertError.message);
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: user.user_metadata?.avatar_url || existingProfile.avatar_url,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            existingProfile.full_name,
          username:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            existingProfile.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Update profile error:', updateError.message);
      }
    }
  }

  return response;
}