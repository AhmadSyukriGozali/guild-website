'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    'Memproses data login...'
  );

  const processedRef = useRef(false);

  /*
   * Handler untuk membuat / memperbarui profil setelah session didapat.
   */
  const handleUserProfile = useCallback(async (user) => {
    setMessage('Menyiapkan profil pengguna...');

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
     * Cek profil pengguna.
     */
    const {
      data: existingProfile,
      error: checkError,
    } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error(
        'Gagal memeriksa profil:',
        checkError
      );
    }

    /*
     * Buat profil baru jika belum ada.
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
     * Perbarui data profil jika sudah ada.
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

    setTimeout(() => {
      router.replace('/dashboard');
    }, 500);
  }, [router]);

  useEffect(() => {
    /*
     * 1. Coba langsung ambil session (untuk Discord yang pakai implicit/hash).
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !processedRef.current) {
        processedRef.current = true;
        handleUserProfile(session.user);
      }
    });

    /*
     * 2. Listener untuk menangkap session event (PKCE flow untuk Google).
     */
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.user &&
          !processedRef.current
        ) {
          processedRef.current = true;
          handleUserProfile(session.user);
        }
      }
    );

    /*
     * 3. Cleanup: jika dalam 15 detik tidak ada session, redirect ke login.
     */
    const timeout = setTimeout(() => {
      if (!processedRef.current) {
        console.warn(
          'Callback timeout — tidak ada session dalam 15 detik.'
        );
        console.log('URL callback:', window.location.href);
        processedRef.current = true;
        router.replace(
          `/login?error=${encodeURIComponent(
            'Data login tidak ditemukan. Silakan login kembali.'
          )}`
        );
      }
    }, 15000);

    return () => {
      authListener?.subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, handleUserProfile]);

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
