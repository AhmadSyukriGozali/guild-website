'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Timer, CheckCircle2, Lock, Unlock, RefreshCw, AlertCircle, Plus } from 'lucide-react';

export default function BossTrackerPage() {
  // Mock profile (nanti otomatis tersambung ke Supabase Auth)
  const [profile] = useState({
    id: 'user-123',
    username: 'Ahmad Syukri',
    role: 'guild_master', // 'member', 'officer', 'guild_master'
  });

  // Sample data Boss Tracker
  const [bosses, setBosses] = useState([
    {
      id: 'b1',
      name: 'Nefarian The Red',
      location: 'Volcano Peak Ch.1',
      cooldownMinutes: 120,
      nextSpawn: new Date(Date.now() + 15 * 60 * 1000), // 15 menit lagi
      isLocked: false,
      attendees: ['Ahmad Syukri', 'ShadowHunter', 'Valkyrie'],
      hasAttended: true,
    },
    {
      id: 'b2',
      name: 'Lord Kazzak',
      location: 'Blasted Lands Ch.2',
      cooldownMinutes: 240,
      nextSpawn: new Date(Date.now() + 85 * 60 * 1000), // 1 jam 25 menit lagi
      isLocked: false,
      attendees: ['Valkyrie'],
      hasAttended: false,
    },
    {
      id: 'b3',
      name: 'Onyxia Dragon',
      location: 'Onyxia Lair',
      cooldownMinutes: 360,
      nextSpawn: new Date(Date.now() - 10 * 60 * 1000), // Sudah spawn!
      isLocked: true,
      attendees: ['Ahmad Syukri', 'ShadowHunter', 'IronClad', 'MagePro'],
      hasAttended: true,
    },
  ]);

  const isStaffOrGM = ['guild_master', 'officer'].includes(profile.role);

  // Function: Tekan Tombol HADIR (Self-Absen)
  const handleAttendance = (bossId) => {
    setBosses((prev) =>
      prev.map((b) => {
        if (b.id === bossId && !b.isLocked) {
          if (b.hasAttended) {
            // Cancel Absen
            return {
              ...b,
              hasAttended: false,
              attendees: b.attendees.filter((name) => name !== profile.username),
            };
          } else {
            // Tambah Absen
            return {
              ...b,
              hasAttended: true,
              attendees: [...b.attendees, profile.username],
            };
          }
        }
        return b;
      })
    );
  };

  // Function: Lock / Unlock Absen (Staff / GM Only)
  const toggleLock = (bossId) => {
    if (!isStaffOrGM) return;
    setBosses((prev) =>
      prev.map((b) => (b.id === bossId ? { ...b, isLocked: !b.isLocked } : b))
    );
  };

  // Function: Mark Dead / Reset Cooldown (Staff / GM Only)
  const handleMarkDead = (bossId, cooldownMinutes) => {
    if (!isStaffOrGM) return;
    const newSpawn = new Date(Date.now() + cooldownMinutes * 60 * 1000);
    setBosses((prev) =>
      prev.map((b) =>
        b.id === bossId
          ? {
              ...b,
              nextSpawn: newSpawn,
              isLocked: false,
              attendees: [],
              hasAttended: false,
            }
          : b
      )
    );
  };

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