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
    let isMounted = true;

    const completeLogin = async () => {
      try {
        const currentUrl = new URL(window.location.href);

        const code = currentUrl.searchParams.get('code');

        /*
         * PKCE flow:
         * Google mengembalikan parameter "code".
         * Code tersebut ditukar menjadi session Supabase.
         */
        if (code) {
          setMessage('Menyelesaikan login Google...');

          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error(
              'Gagal menukar kode login:',
              error
            );

            if (isMounted) {
              router.replace(
                `/login?error=${encodeURIComponent(
                  'Gagal menyelesaikan login. Silakan login kembali.'
                )}`
              );
            }

            return;
          }
        }

        /*
         * Setelah code ditukar atau session sudah tersedia,
         * ambil session aktif.
         */
        setMessage('Memeriksa sesi login...');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            'Gagal membaca session:',
            sessionError
          );
        }

        if (!session) {
          console.error(
            'Session tidak ditemukan setelah callback.'
          );

          if (isMounted) {
            router.replace(
              `/login?error=${encodeURIComponent(
                'Data login tidak ditemukan. Silakan login kembali.'
              )}`
            );
          }

          return;
        }

        const user = session.user;

        setMessage('Menyiapkan profil pengguna...');

        /*
         * Cek apakah profil pengguna sudah ada.
         */
        const {
          data: existingProfile,
          error: profileCheckError,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileCheckError) {
          console.error(
            'Gagal memeriksa profil:',
            profileCheckError
          );
        }

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
         * Jika profil belum ada,
         * buat profil baru sebagai guest.
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
         * perbarui data dasar dari provider.
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

        setMessage(
          'Login berhasil. Membuka dashboard...'
        );

        /*
         * Beri waktu singkat agar session tersimpan,
         * kemudian pindah ke dashboard.
         */
        setTimeout(() => {
          if (isMounted) {
            router.replace('/dashboard');
          }
        }, 500);

      } catch (error) {
        console.error(
          'Kesalahan pada halaman callback:',
          error
        );

        if (isMounted) {
          router.replace(
            `/login?error=${encodeURIComponent(
              'Terjadi kesalahan saat memproses login.'
            )}`
          );
        }
      }
    };

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">

        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

        <h1 className="text-2xl font-bold">
          Memproses Login
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>

      </div>

    </div>
  );
}