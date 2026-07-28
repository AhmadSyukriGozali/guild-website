'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] =
    useState('');

  const [
    loadingProvider,
    setLoadingProvider,
  ] = useState('');

  const handleOAuthLogin =
    async (provider) => {
      try {
        setLoadingProvider(provider);
        setErrorMsg('');

        const redirectTo =
          `${window.location.origin}/auth/callback`;

        const {
          error,
        } = await supabase.auth.signInWithOAuth({
          provider,

          options: {
            redirectTo,

            // Memastikan OAuth memakai
            // authorization code flow.
            skipBrowserRedirect: false,
          },
        });

        if (error) {
          console.error(
            'OAuth start error:',
            error
          );

          setErrorMsg(
            error.message
          );

          setLoadingProvider('');

          return;
        }
      } catch (error) {
        console.error(
          'OAuth unexpected error:',
          error
        );

        setErrorMsg(
          'Gagal memulai login. Coba lagi.'
        );

        setLoadingProvider('');
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            <Shield className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-wide">
            Guild Portal
          </h1>

          <p className="text-sm text-slate-400">
            Masuk dengan Google atau Discord
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() =>
              handleOAuthLogin(
                'google'
              )
            }
            disabled={
              loadingProvider !== ''
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProvider ===
            'google'
              ? 'Memproses...'
              : 'Lanjutkan dengan Google'}
          </button>

          <button
            type="button"
            onClick={() =>
              handleOAuthLogin(
                'discord'
              )
            }
            disabled={
              loadingProvider !== ''
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProvider ===
            'discord'
              ? 'Memproses...'
              : 'Lanjutkan dengan Discord'}
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500">
            Setelah login, akun baru
            masuk sebagai{' '}
            <span className="font-medium text-slate-400">
              Guest
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}