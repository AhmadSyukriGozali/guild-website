'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyStaffPage() {
  const [passkey, setPasskey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify-passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passkey }),
      });

      const result = await res.json();

      if (!res.ok || !result.valid) {
        setErrorMsg(result.error || 'Passkey salah.');
        return;
      }

      // Passkey valid — ambil session user dan update role jadi officer
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setErrorMsg('Sesi login tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'officer', 
          status: 'active',
          updated_at: new Date().toISOString() 
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Gagal update role:', updateError.message);
        setErrorMsg('Gagal mengubah role akun: ' + updateError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Verifikasi Staff / GM</h1>
          <p className="text-sm text-slate-400">
            Masukkan master passkey untuk mengubah role akun.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Master Passkey</label>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Masukkan passkey"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-60"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>
    </div>
  );
}