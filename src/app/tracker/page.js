'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Timer, CheckCircle2, Lock, Unlock, RefreshCw, AlertCircle, Plus } from 'lucide-react';

export default function BossTrackerPage() {
  const [profile, setProfile] = useState(null);
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendedBossIds, setAttendedBossIds] = useState(new Set());

  // Ambil profile & data dari Supabase
  useEffect(() => {
    async function loadData() {
      // Ambil session & profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      }

      // Ambil daftar boss dari database
      const { data: bossData, error: bossError } = await supabase
        .from('boss_tracker')
        .select('*')
        .order('created_at', { ascending: true });

      if (bossError) {
        console.error('Error fetching bosses:', bossError.message);
      } else if (bossData) {
        // Ambil attendance untuk setiap boss
        const bossesWithAttendees = await Promise.all(
          bossData.map(async (boss) => {
            // Ambil daftar peserta
            const { data: attendees } = await supabase
              .from('boss_attendance')
              .select('user_id')
              .eq('boss_id', boss.id);

            // Ambil username dari profiles
            let attendeeNames = [];
            if (attendees && attendees.length > 0) {
              const userIds = attendees.map(a => a.user_id);
              const { data: attendeeProfiles } = await supabase
                .from('profiles')
                .select('username, ign, id')
                .in('id', userIds);

              if (attendeeProfiles) {
                attendeeNames = attendeeProfiles.map(p => p.username || p.ign || 'Unknown');
              }
            }

            // Cek apakah user sudah absen
            const hasAttended = attendees?.some(a => a.user_id === session?.user?.id) || false;

            return {
              ...boss,
              attendees: attendeeNames,
              hasAttended,
            };
          })
        );

        setBosses(bossesWithAttendees);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const isStaffOrGM = profile && ['guild_master', 'officer'].includes(profile.role);

  // Function: Tekan Tombol HADIR (Self-Absen)
  const handleAttendance = async (bossId) => {
    if (!profile) return;

    const boss = bosses.find(b => b.id === bossId);
    if (!boss || boss.is_locked) return;

    if (boss.hasAttended) {
      // Cancel Absen — delete dari database
      const { error } = await supabase
        .from('boss_attendance')
        .delete()
        .eq('boss_id', bossId)
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error removing attendance:', error.message);
        return;
      }

      // Update local state
      setBosses((prev) =>
        prev.map((b) => {
          if (b.id === bossId) {
            return {
              ...b,
              hasAttended: false,
              attendees: b.attendees.filter((name) => name !== (profile.username || profile.ign)),
            };
          }
          return b;
        })
      );
    } else {
      // Tambah Absen — insert ke database
      const { error } = await supabase
        .from('boss_attendance')
        .insert({
          boss_id: bossId,
          user_id: profile.id,
        });

      if (error) {
        console.error('Error adding attendance:', error.message);
        return;
      }

      // Update local state
      setBosses((prev) =>
        prev.map((b) => {
          if (b.id === bossId) {
            return {
              ...b,
              hasAttended: true,
              attendees: [...b.attendees, profile.username || profile.ign || 'Unknown'],
            };
          }
          return b;
        })
      );
    }
  };

  // Function: Lock / Unlock Absen (Staff / GM Only)
  const toggleLock = async (bossId) => {
    if (!isStaffOrGM) return;
    const boss = bosses.find(b => b.id === bossId);
    if (!boss) return;

    const newLockState = !boss.is_locked;
    const { error } = await supabase
      .from('boss_tracker')
      .update({ is_locked: newLockState })
      .eq('id', bossId);

    if (error) {
      console.error('Error toggling lock:', error.message);
      return;
    }

    setBosses((prev) =>
      prev.map((b) => (b.id === bossId ? { ...b, is_locked: newLockState } : b))
    );
  };

  // Function: Mark Dead / Reset Cooldown (Staff / GM Only)
  const handleMarkDead = async (bossId, cooldownMinutes) => {
    if (!isStaffOrGM) return;
    const newSpawn = new Date(Date.now() + cooldownMinutes * 60 * 1000);

    const { error } = await supabase
      .from('boss_tracker')
      .update({
        next_spawn: newSpawn.toISOString(),
        is_locked: false,
      })
      .eq('id', bossId);

    if (error) {
      console.error('Error marking dead:', error.message);
      return;
    }

    // Hapus semua attendance lama
    await supabase
      .from('boss_attendance')
      .delete()
      .eq('boss_id', bossId);

    setBosses((prev) =>
      prev.map((b) =>
        b.id === bossId
          ? {
              ...b,
              next_spawn: newSpawn,
              is_locked: false,
              attendees: [],
              hasAttended: false,
            }
          : b
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        <Sidebar userProfile={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar userProfile={profile} />

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Timer className="w-7 h-7 text-emerald-400" />
              Realtime Boss Tracker
            </h1>
            <p className="text-slate-400 text-sm">
              Pantau jam spawn boss dan catat kehadiran anggota secara transparan.
            </p>
          </div>

          {isStaffOrGM && (
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
              <Plus className="w-4 h-4" />
              Tambah Boss Baru
            </button>
          )}
        </div>

        {/* Boss Cards List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bosses.map((boss) => {
            const isSpawned = new Date() >= boss.nextSpawn;

            return (
              <div
                key={boss.id}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-5 transition-all ${
                  isSpawned
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{boss.location}</span>
                    <h3 className="text-lg font-bold text-slate-100">{boss.name}</h3>
                  </div>

                  {/* Status Indicator Badge */}
                  {isSpawned ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      ● BOSS SPAWNED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                      Respawn: {boss.cooldownMinutes}m
                    </span>
                  )}
                </div>

                {/* Status Box & Timer */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Status Absensi:</p>
                    <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                      {boss.isLocked ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Dikunci (Locked)
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" /> Terbuka (Open)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Peserta Hadir:</p>
                    <p className="text-lg font-bold text-indigo-400">{boss.attendees.length} Member</p>
                  </div>
                </div>

                {/* List Nama Peserta Ringkas */}
                {boss.attendees.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">List Member Hadir:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {boss.attendees.map((name, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions / Tombol Kontrol */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {/* Tombol Absen Mandiri (Member) */}
                  <button
                    onClick={() => handleAttendance(boss.id)}
                    disabled={boss.isLocked}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all ${
                      boss.isLocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : boss.hasAttended
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {boss.hasAttended ? 'SUDAH HADIR (Batal)' : 'SAYA HADIR'}
                  </button>

                  {/* Tombol Kontrol Khusus Staff / GM */}
                  {isStaffOrGM && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLock(boss.id)}
                        title={boss.isLocked ? 'Buka Absen' : 'Kunci Absen'}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      >
                        {boss.isLocked ? (
                          <Lock className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Unlock className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleMarkDead(boss.id, boss.cooldownMinutes)}
                        className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors border border-rose-500/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Mark Dead
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}