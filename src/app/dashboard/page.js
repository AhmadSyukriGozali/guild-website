'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Bell, ShieldAlert, Trophy, Users, Timer } from 'lucide-react';

export default function DashboardPage() {
  // Mock Data Profil sementara (nanti otomatis diambil dari Supabase)
  const [profile] = useState({
    username: 'Ahmad Syukri',
    role: 'guild_master', // opsi: 'member', 'officer', 'guild_master'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigasi */}
      <Sidebar userProfile={profile} />

      {/* Konten Utama */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        
        {/* Topbar Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Selamat Datang, {profile.username}! 👋</h1>
            <p className="text-slate-400 text-sm">Berikut ringkasan aktivitas guild hari ini.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400">Role Akses:</span>
            <span className="text-xs font-bold text-amber-400 capitalize bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              {profile.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Grid Kartu Statistik Ringkas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Member Active</p>
              <h3 className="text-xl font-bold text-slate-100">48 / 50</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Boss Spawn Terdekat</p>
              <h3 className="text-xl font-bold text-emerald-400">12m 45s</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Guild Rank</p>
              <h3 className="text-xl font-bold text-amber-400">#3 Server</h3>
            </div>
          </div>
        </div>

        {/* Notice Board / Pengumuman Resmi Guild */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Bell className="w-5 h-5" />
            <h2 className="font-bold text-slate-100 text-lg">Pengumuman Resmi Guild (Notice Board)</h2>
          </div>
          
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                📌 PENTING - WAR PREPARATION
              </span>
              <span className="text-xs text-slate-500">2 Jam Yang Lalu</span>
            </div>
            <h3 className="font-semibold text-slate-200">Jadwal Guild War & Wajib Absensi Boss Tracker</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Seluruh member diharapkan standby jam 20:00 WIB untuk persiapan Guild War. Pastikan selalu menekan tombol <strong className="text-slate-200">"HADIR"</strong> di menu Boss Tracker saat berpartisipasi agar tercatat pada audit looting!
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}