'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ShieldCheck, KeyRound, Lock, Globe, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminPanelPage() {
  const [profile] = useState({
    username: 'Ahmad Syukri',
    role: 'guild_master', // 'guild_master' atau 'officer'
  });

  // State Pengaturan System
  const [guildName, setGuildName] = useState('Valkyrie Alliance');
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [emergencyLock, setEmergencyLock] = useState(false);
  
  // Status Feedback
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle Update Master Passkey
  const handleUpdatePasskey = (e) => {
    e.preventDefault();
    if (!newPasskey || !confirmPasskey) {
      setMessage({ type: 'error', text: 'Semua kolom passkey wajib diisi!' });
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setMessage({ type: 'error', text: 'Konfirmasi passkey baru tidak cocok!' });
      return;
    }

    // Simulasi simpan ke Supabase DB (Tabel app_settings)
    setMessage({ type: 'success', text: 'Master Passkey Pengurus berhasil diperbarui!' });
    setCurrentPasskey('');
    setNewPasskey('');
    setConfirmPasskey('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigasi */}
      <Sidebar userProfile={profile} />

      {/* Konten Utama */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            Admin & Developer Control Panel
          </h1>
          <p className="text-slate-400 text-sm">
            Pengaturan khusus Pengurus Guild (Master Passkey & Konfigurasi Global).
          </p>
        </div>

        {/* Banner Alert Notifikasi */}
        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 border ${
              message.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Kelola Master Passkey Pengurus */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-base">Master Passkey Pengurus</h2>
                <p className="text-xs text-slate-400">Ubah passkey tunggal untuk login Staff & GM.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePasskey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Passkey Lama</label>
                <input
                  type="password"
                  placeholder="Masukkan passkey saat ini..."
                  value={currentPasskey}
                  onChange={(e) => setCurrentPasskey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Passkey Baru</label>
                <input
                  type="password"
                  placeholder="Masukkan passkey baru..."
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Konfirmasi Passkey Baru</label>
                <input
                  type="password"
                  placeholder="Ulangi passkey baru..."
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                <Save className="w-4 h-4" /> Simpan Passkey Baru
              </button>
            </form>
          </div>

          {/* Card 2: Pengaturan Sakelar System & Emergency */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-base">Pengaturan Global Guild</h2>
                <p className="text-xs text-slate-400">Konfigurasi identitas & sakelar darurat sistem.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama Guild / Server</label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Sakelar Lock Darurat */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" /> Sakelar Lock Semua Absensi
                  </span>
                  <p className="text-xs text-slate-500">
                    Mengunci seluruh tombol "HADIR" di Boss Tracker secara serentak.
                  </p>
                </div>

                <button
                  onClick={() => setEmergencyLock(!emergencyLock)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    emergencyLock
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {emergencyLock ? 'AKTIF (LOCKED)' : 'NON-AKTIF'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}