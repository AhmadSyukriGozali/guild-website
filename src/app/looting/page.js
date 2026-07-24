'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Coins, Upload, Image as ImageIcon, Users, CheckCircle, Edit3, ShieldAlert } from 'lucide-react';

export default function BossLootingPage() {
  const [profile] = useState({
    username: 'Ahmad Syukri',
    role: 'guild_master', // 'member', 'officer', 'guild_master'
  });

  const isStaffOrGM = ['guild_master', 'officer'].includes(profile.role);

  // Sample Data History Looting
  const [loots, setLoots] = useState([
    {
      id: 'l1',
      bossName: 'Onyxia Dragon',
      killedAt: '24 Jul 2026 - 21:00 WIB',
      droppedItems: 'Onyxia Scale Cloak, Dragon Ring (Epic)',
      proofImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      attendees: ['Ahmad Syukri', 'ShadowHunter', 'IronClad', 'MagePro'],
    },
    {
      id: 'l2',
      bossName: 'Lord Kazzak',
      killedAt: '24 Jul 2026 - 18:30 WIB',
      droppedItems: 'Demonic Amulet (Legendary), 5000 Gold',
      proofImage: null, // Belum diupload
      attendees: ['Ahmad Syukri', 'Valkyrie', 'MagePro'],
    },
  ]);

  const [selectedLoot, setSelectedLoot] = useState(loots[0]);
  const [newNote, setNewNote] = useState('');

  // Handle Mock Upload Screenshot Bukti
  const handleUploadImage = (lootId) => {
    const mockImageUrl = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80';
    setLoots((prev) =>
      prev.map((item) => (item.id === lootId ? { ...item, proofImage: mockImageUrl } : item))
    );
    if (selectedLoot.id === lootId) {
      setSelectedLoot((prev) => ({ ...prev, proofImage: mockImageUrl }));
    }
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
            <Coins className="w-7 h-7 text-amber-400" />
            Boss Looting & Audit Logs
          </h1>
          <p className="text-slate-400 text-sm">
            Rekapitulasi riwayat pembagian *loot* dan daftar kehadiran anggota secara transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Riwayat Kill Boss */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Riwayat Kematian Boss
            </h2>
            {loots.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedLoot(item)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedLoot.id === item.id
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-200">{item.bossName}</h3>
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                    {item.attendees.length} Member
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.killedAt}</p>
                <p className="text-xs text-amber-400/90 font-medium mt-2 truncate">
                  💎 Drop: {item.droppedItems || 'Belum diisi'}
                </p>
              </div>
            ))}
          </div>

          {/* Kolom Kanan: Detail Loot & Bukti Screenshot */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            {/* Header Detail */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-100">{selectedLoot.bossName}</h2>
                <p className="text-xs text-slate-400">{selectedLoot.killedAt}</p>
              </div>

              {isStaffOrGM && (
                <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Akses Moderasi Staff
                </span>
              )}
            </div>

            {/* Bukti Screenshot Loot */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Bukti Screenshot Loot (In-Game Screenshot)
              </label>

              {selectedLoot.proofImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-64">
                  <img
                    src={selectedLoot.proofImage}
                    alt="Loot Screenshot"
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3 bg-slate-950/40">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">Belum ada screenshot bukti drop item yang diunggah.</p>
                  
                  {isStaffOrGM && (
                    <button
                      onClick={() => handleUploadImage(selectedLoot.id)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Screenshot (Simulasi)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Item Drop Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Daftar Drop Item
              </label>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200">
                {selectedLoot.droppedItems}
              </div>
            </div>

            {/* List Peserta Terverifikasi Hadir */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Daftar Peserta Yang Menekan HADIR ({selectedLoot.attendees.length})
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedLoot.attendees.map((name, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-300"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}