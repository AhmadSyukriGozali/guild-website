'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, KeyRound, Lock, Globe, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminPanelPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Pengaturan System
  const [guildName, setGuildName] = useState('My Guild');
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [emergencyLock, setEmergencyLock] = useState(false);
  
  // Status Feedback
  const [message, setMessage] = useState({ type: '', text: '' });

  // Ambil data profile & app_settings dari Supabase
  useEffect(() => {
    async function loadAdminData() {
      // Ambil session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      }

      // Ambil app_settings
      const { data: settings } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .single();

      if (settings) {
        setGuildName(settings.guild_name || 'My Guild');
        setEmergencyLock(settings.emergency_lock || false);
      }

      setLoading(false);
    }

    loadAdminData();
  }, []);

  // Handle Update Master Passkey
  const handleUpdatePasskey = async (e) => {
    e.preventDefault();
    if (!newPasskey || !confirmPasskey) {
      setMessage({ type: 'error', text: 'Semua kolom passkey wajib diisi!' });
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setMessage({ type: 'error', text: 'Konfirmasi passkey baru tidak cocok!' });
      return;
    }

    // Simpan ke Supabase DB (Tabel app_settings)
    const { error } = await supabase
      .from('app_settings')
      .update({
        master_passkey_hash: newPasskey,
        updated_at: new Date().toISOString(),
        updated_by: profile?.id,
      })
      .eq('id', 1); // Hanya ada 1 baris app_settings

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan passkey: ' + error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Master Passkey Pengurus berhasil diperbarui!' });
    setCurrentPasskey('');
    setNewPasskey('');
    setConfirmPasskey('');
  };

  // Handle Save Guild Name
  const handleSaveGuildName = async () => {
    const { error } = await supabase
      .from('app_settings')
      .update({
        guild_name: guildName,
        updated_at: new Date().toISOString(),
        updated_by: profile?.id,
      })
      .eq('id', 1);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan nama guild: ' + error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Nama Guild berhasil diperbarui!' });
  };

  // Handle Toggle Emergency Lock
  const handleToggleLock = async () => {
    const newLockState = !emergencyLock;
    const { error } = await supabase
      .from('app_settings')
      .update({
        emergency_lock: newLockState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah status lock: ' + error.message });
      return;
    }

    setEmergencyLock(newLockState);
    setMessage({ type: 'success', text: newLockState ? 'Lock darurat AKTIF!' : 'Lock darurat dinonaktifkan.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        <Sidebar userProfile={null} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

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
                  onClick={handleToggleLock}
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