'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    'Memproses data login...'
  );

  useEffect(() => {
    let isMounted = true;

    async function processLogin() {
      try {
        const currentUrl = new URL(window.location.href);

        const code = currentUrl.searchParams.get('code');

        /*
         * MODE 1:
         * Jika Google mengirim authorization code,
         * tukarkan code menjadi session.
         */
        if (code) {
          setMessage('Menyelesaikan autentikasi...');

          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error(
              'Gagal menukar kode OAuth:',
              exchangeError
            );

            router.replace(
              `/login?error=${encodeURIComponent(
                'Gagal menyelesaikan login Google. Silakan login kembali.'
              )}`
            );

            return;
          }
        }

        /*
         * MODE 2:
         * Jika provider mengirim token pada URL fragment:
         *
         * #access_token=...
         * #refresh_token=...
         *
         * Token harus dibaca secara manual.
         */
        const hashParams = new URLSearchParams(
          window.location.hash.replace('#', '')
        );

        const accessToken =
          hashParams.get('access_token');

        const refreshToken =
          hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          setMessage('Menyimpan sesi login...');

          const { error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (setSessionError) {
            console.error(
              'Gagal menyimpan session:',
              setSessionError
            );

            router.replace(
              `/login?error=${encodeURIComponent(
                'Session login tidak dapat disimpan. Silakan login kembali.'
              )}`
            );

            return;
          }

          /*
           * Bersihkan token dari address bar.
           */
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        /*
         * Tunggu sebentar agar Supabase selesai
         * menyimpan session di browser.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        setMessage('Memeriksa sesi pengguna...');

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            'Gagal membaca session:',
            sessionError
          );
        }

        const session = sessionData?.session;

        if (!session) {
          console.error(
            'Session tidak ditemukan.'
          );

          router.replace(
            `/login?error=${encodeURIComponent(
              'Data login tidak ditemukan. Silakan login kembali.'
            )}`
          );

          return;
        }

        const user = session.user;

        setMessage('Menyiapkan profil pengguna...');

        /*
         * Ambil data pengguna dari Google atau Discord.
         */
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          user.email?.split('@')[0] ||
          'User';

        const username =
          user.user_metadata?.preferred_username ||
          user.user_metadata?.user_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User';

        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          '';

        const provider =
          user.app_metadata?.provider ||
          'unknown';

        /*
         * Periksa apakah profil sudah ada.
         */
        const {
          data: existingProfile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            'Gagal memeriksa profil:',
            profileError
          );
        }

        /*
         * Jika belum ada, buat sebagai guest.
         */
        if (!existingProfile) {
          const { error: insertError } =
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username,
                full_name: fullName,
                avatar_url: avatarUrl,
                email: user.email || '',
                provider,
                role: 'guest',
                status: 'guest',
                joined_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

          if (insertError) {
            console.error(
              'Gagal membuat profil:',
              insertError
            );
          }
        }

        /*
         * Jika profil sudah ada,
         * perbarui data dasar pengguna.
         */
        if (existingProfile) {
          const { error: updateError } =
            await supabase
              .from('profiles')
              .update({
                username,
                full_name: fullName,
                avatar_url: avatarUrl,
                email: user.email || '',
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

        if (!isMounted) {
          return;
        }

        setMessage(
          'Login berhasil. Membuka dashboard...'
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        router.replace('/dashboard');

      } catch (error) {
        console.error(
          'Kesalahan callback login:',
          error
        );

        router.replace(
          `/login?error=${encodeURIComponent(
            'Terjadi kesalahan saat memproses login.'
          )}`
        );
      }
    }

    processLogin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">

      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">

        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

        <h1 className="text-2xl font-bold">
          Memproses Login
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>

      </section>

    </main>
  );
}