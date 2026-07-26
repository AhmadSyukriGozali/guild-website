'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingProvider, setLoadingProvider] = useState('');

  const handleOAuthLogin = async (provider) => {
    try {
      setLoadingProvider(provider);
      setErrorMsg('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      }
    } catch {
      setErrorMsg('Gagal memulai login. Coba lagi.');
    } finally {
      setLoadingProvider('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Guild Portal</h1>
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
            onClick={() => handleOAuthLogin('google')}
            disabled={loadingProvider === 'google'}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            {loadingProvider === 'google' ? 'Memproses...' : 'Lanjutkan dengan Google'}
          </button>

          <button
            onClick={() => handleOAuthLogin('discord')}
            disabled={loadingProvider === 'discord'}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:opacity-60"
          >
            {loadingProvider === 'discord' ? 'Memproses...' : 'Lanjutkan dengan Discord'}
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500">
            Setelah login, akun baru masuk sebagai <span className="font-medium text-slate-400">Guest</span>.
          </p>
        </div>
      </div>
    </div>
  );
}