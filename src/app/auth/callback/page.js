'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Menyelesaikan proses login...');

  useEffect(() => {
    let isMounted = true;

    async function completeLogin() {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          if (isMounted) {
            setMessage('Token login tidak ditemukan.');

            setTimeout(() => {
              router.replace(
                '/login?error=' +
                  encodeURIComponent('Token login tidak ditemukan.')
              );
            }, 1500);
          }

          return;
        }

        if (isMounted) {
          setMessage('Menyimpan sesi login...');
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }

        const user = data.user;

        if (!user) {
          throw new Error('Data pengguna tidak ditemukan.');
        }

        if (isMounted) {
          setMessage('Menyiapkan profil pengguna...');
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
          'oauth';

        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, email, provider, role, status')
            .eq('id', user.id)
            .maybeSingle();

        if (profileCheckError) {
          throw new Error(
            `Gagal memeriksa profil: ${profileCheckError.message}`
          );
        }

        if (!existingProfile) {
          const { error: insertError } = await supabase
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
            throw new Error(
              `Gagal membuat profil: ${insertError.message}`
            );
          }
        } else {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username:
                existingProfile.username ||
                username,
              full_name:
                fullName ||
                existingProfile.full_name ||
                '',
              avatar_url:
                avatarUrl ||
                existingProfile.avatar_url ||
                '',
              email:
                user.email ||
                existingProfile.email ||
                '',
              provider:
                provider ||
                existingProfile.provider ||
                'oauth',
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            throw new Error(
              `Gagal memperbarui profil: ${updateError.message}`
            );
          }
        }

        if (isMounted) {
          setMessage('Login berhasil. Membuka dashboard...');

          window.history.replaceState(
            null,
            '',
            '/auth/callback'
          );

          router.replace('/dashboard');
          router.refresh();
        }
      } catch (error) {
        console.error('Auth callback error:', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat menyelesaikan login.';

        if (isMounted) {
          setMessage(errorMessage);

          setTimeout(() => {
            router.replace(
              '/login?error=' +
                encodeURIComponent(errorMessage)
            );
          }, 2500);
        }
      }
    }

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

        <h1 className="text-xl font-bold">
          Memproses Login
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      </section>
    </main>
  );
}