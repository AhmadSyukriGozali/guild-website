import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Tukar code OAuth dengan session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    // Cek apakah profile user sudah ada, jika belum auto-create
    const userId = data.session?.user?.id;
    if (userId) {
      const user = data.session.user;

      // Cek apakah profile sudah ada
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      // Jika belum ada, insert profile
      if (!existingProfile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          username: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          email: user.email || '',
          provider: user.app_metadata?.provider || 'email',
          role: 'guest',
        });

        if (insertError) {
          console.error('Auto-create profile error:', insertError.message);
        }
      } else {
        // Update profile (avatar, name, dll dari provider)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: user.user_metadata?.avatar_url || existingProfile.avatar_url,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
            username: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.username,
            last_login: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Update profile error:', updateError.message);
        }
      }
    }
  }

  // Redirect pengguna ke Dashboard utama setelah berhasil login
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
