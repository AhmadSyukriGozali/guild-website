'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    'Memeriksa data login...'
  );

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const url = new URL(window.location.href);

        // Google biasanya mengirim authorization code:
        // /auth/callback?code=xxxxxxxx
        const code = url.searchParams.get('code');

        // Discord pada konfigurasi sebelumnya mengirim token:
        // /auth/callback#access_token=xxxxxxxx
        const hashParams = new URLSearchParams(
          window.location.hash.replace('#', '')
        );

        const accessToken =
          hashParams.get('access_token');

        const refreshToken =
          hashParams.get('refresh_token');

        // ==========================================
        // 1. LOGIN GOOGLE — TUKAR CODE MENJADI SESSION
        // ==========================================

        if (code) {
          setMessage(
            'Menyelesaikan login Google...'
          );

          const {
            data: exchangeData,
            error: exchangeError,
          } = await supabase.auth.exchangeCodeForSession(
            code
          );

          if (exchangeError) {
            console.error(
              'Google exchange error:',
              exchangeError
            );

            router.replace(
              `/login?error=${encodeURIComponent(
                `Login Google gagal: ${exchangeError.message}`
              )}`
            );

            return;
          }

          if (!exchangeData?.session) {
            console.error(
              'Google tidak menghasilkan session:',
              exchangeData
            );

            router.replace(
              `/login?error=${encodeURIComponent(
                'Google berhasil diautentikasi, tetapi session tidak berhasil dibuat.'
              )}`
            );

            return;
          }
        }

        // ==========================================
        // 2. LOGIN DISCORD — SIMPAN TOKEN DARI HASH
        // ==========================================

        else if (accessToken && refreshToken) {
          setMessage(
            'Menyimpan sesi Discord...'
          );

          const { error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (setSessionError) {
            console.error(
              'Discord session error:',
              setSessionError
            );

            router.replace(
              `/login?error=${encodeURIComponent(
                `Login Discord gagal: ${setSessionError.message}`
              )}`
            );

            return;
          }

          // Menghapus token dari address bar
          window.history.replaceState(
            {},
            document.title,
            '/auth/callback'
          );
        }

        // ==========================================
        // 3. JIKA TIDAK ADA CODE ATAU TOKEN
        // ==========================================

        else {
          console.error(
            'OAuth callback tidak menerima code atau token.',
            {
              search: window.location.search,
              hash: window.location.hash
                ? 'ADA HASH'
                : 'TIDAK ADA HASH',
            }
          );

          router.replace(
            `/login?error=${encodeURIComponent(
              'Data login tidak ditemukan pada halaman callback.'
            )}`
          );

          return;
        }

        if (cancelled) {
          return;
        }

        setMessage(
          'Memeriksa sesi pengguna...'
        );

        // Beri waktu singkat agar session tersimpan
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            'Get session error:',
            sessionError
          );

          router.replace(
            `/login?error=${encodeURIComponent(
              `Gagal membaca session: ${sessionError.message}`
            )}`
          );

          return;
        }

        const session =
          sessionData?.session;

        if (!session?.user) {
          console.error(
            'Session kosong setelah OAuth.',
            sessionData
          );

          router.replace(
            `/login?error=${encodeURIComponent(
              'Session login tidak berhasil disimpan.'
            )}`
          );

          return;
        }

        const user = session.user;

        setMessage(
          'Menyiapkan profil pengguna...'
        );

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

        // Memeriksa apakah profil sudah ada
        const {
          data: existingProfile,
          error: profileCheckError,
        } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileCheckError) {
          console.error(
            'Profile check error:',
            profileCheckError
          );
        }

        // Membuat profil baru
        if (!existingProfile) {
          const {
            error: insertError,
          } = await supabase
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
              'Profile insert error:',
              insertError
            );
          }
        }

        // Memperbarui profil lama
        else {
          const {
            error: updateError,
          } = await supabase
            .from('profiles')
            .update({
              username,
              full_name: fullName,
              email: user.email || '',
              avatar_url: avatarUrl,
              provider,
              updated_at:
                new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(
              'Profile update error:',
              updateError
            );
          }
        }

        if (cancelled) {
          return;
        }

        setMessage(
          'Login berhasil. Membuka dashboard...'
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );

        router.replace('/dashboard');
        router.refresh();
      } catch (error) {
        console.error(
          'Callback tidak terduga:',
          error
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan tidak dikenal.';

        router.replace(
          `/login?error=${encodeURIComponent(
            `Proses login gagal: ${errorMessage}`
          )}`
        );
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
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