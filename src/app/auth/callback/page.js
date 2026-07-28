'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Memeriksa sesi login...');

  useEffect(() => {
    let isProcessing = false;

    async function processLogin() {
      if (isProcessing) return;

      isProcessing = true;

      try {
        setMessage('Memeriksa data autentikasi...');

        const currentUrl = new URL(window.location.href);

        // Google biasanya mengirim authorization code melalui query parameter.
        const code = currentUrl.searchParams.get('code');

        if (code) {
          setMessage('Menyelesaikan login Google...');

          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Gagal menukar kode OAuth:', error);

            router.replace(
              `/login?error=${encodeURIComponent(
                error.message || 'Gagal menyelesaikan login.'
              )}`
            );

            return;
          }
        }

        // Discord pada konfigurasi sebelumnya mengirim access token
        // melalui bagian hash URL.
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, '')
        );

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          setMessage('Menyimpan sesi Discord...');

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Gagal menyimpan sesi OAuth:', error);

            router.replace(
              `/login?error=${encodeURIComponent(
                error.message || 'Gagal menyimpan sesi login.'
              )}`
            );

            return;
          }

          // Hapus token dari address bar.
          window.history.replaceState(
            {},
            document.title,
            '/auth/callback'
          );
        }

        setMessage('Memeriksa sesi pengguna...');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Gagal membaca sesi:', sessionError);

          router.replace(
            `/login?error=${encodeURIComponent(
              sessionError.message || 'Gagal membaca sesi login.'
            )}`
          );

          return;
        }

        if (!session?.user) {
          router.replace(
            '/login?error=' +
              encodeURIComponent(
                'Token login tidak ditemukan. Silakan login kembali.'
              )
          );

          return;
        }

        const user = session.user;

        setMessage('Menyiapkan profil pengguna...');

        const username =
          user.user_metadata?.user_name ||
          user.user_metadata?.preferred_username ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
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
          'oauth';

        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (profileCheckError) {
          console.error(
            'Gagal memeriksa profil:',
            profileCheckError
          );
        }

        if (!existingProfile) {
          const { error: insertError } =
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username,
                full_name: fullName,
                email: user.email || '',
                avatar_url: avatarUrl,
                provider,
                role: 'guest',
                status: 'guest',
              });

          if (insertError) {
            console.error(
              'Gagal membuat profil:',
              insertError
            );
          }
        } else {
          const { error: updateError } =
            await supabase
              .from('profiles')
              .update({
                username,
                full_name: fullName,
                email: user.email || '',
                avatar_url: avatarUrl,
                provider,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

          if (updateError) {
            console.error(
              'Gagal memperbarui profil:',
              updateError
            );
          }
        }

        setMessage('Login berhasil. Membuka dashboard...');

        router.replace('/dashboard');
        router.refresh();
      } catch (error) {
        console.error(
          'Kesalahan tidak terduga pada callback:',
          error
        );

        router.replace(
          '/login?error=' +
            encodeURIComponent(
              'Terjadi kesalahan saat memproses login.'
            )
        );
      }
    }

    processLogin();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

        <h1 className="text-2xl font-bold">
          Memproses Login
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      </div>
    </main>
  );
}