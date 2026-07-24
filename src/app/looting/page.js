'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Coins, Upload, Image as ImageIcon, Users, CheckCircle, Edit3, ShieldAlert } from 'lucide-react';

export default function BossLootingPage() {
  const [profile, setProfile] = useState(null);
  const [loots, setLoots] = useState([]);
  const [selectedLoot, setSelectedLoot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil profile & loot history dari Supabase
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

      // Ambil loot history dari database
      const { data: lootData, error: lootError } = await supabase
        .from('loot_history')
        .select('*')
        .order('killed_at', { ascending: false });

      if (lootError) {
        console.error('Error fetching loot history:', lootError.message);
      } else if (lootData) {
        // Ambil attendees untuk setiap loot
        const lootsWithAttendees = await Promise.all(
          lootData.map(async (loot) => {
            const { data: attendees } = await supabase
              .from('loot_attendees')
              .select('user_id, ign')
              .eq('loot_id', loot.id);

            let attendeeNames = [];
            if (attendees && attendees.length > 0) {
              // Get usernames from profiles for attendees without ign
              const userIds = attendees.filter(a => !a.ign).map(a => a.user_id);
              if (userIds.length > 0) {
                const { data: attendeeProfiles } = await supabase
                  .from('profiles')
                  .select('username, ign, id')
                  .in('id', userIds);
                
                if (attendeeProfiles) {
                  attendeeNames = [
                    ...attendees.filter(a => a.ign).map(a => a.ign),
                    ...attendeeProfiles.map(p => p.username || p.ign || 'Unknown'),
                  ];
                }
              } else {
                attendeeNames = attendees.map(a => a.ign || 'Unknown');
              }
            }

            return {
              ...loot,
              attendees: attendeeNames,
            };
          })
        );

        setLoots(lootsWithAttendees);
        if (lootsWithAttendees.length > 0) {
          setSelectedLoot(lootsWithAttendees[0]);
        }
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const isStaffOrGM = profile && ['guild_master', 'officer'].includes(profile.role);

  // Handle Upload Screenshot Bukti
  const handleUploadImage = async (lootId) => {
    const mockImageUrl = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80';
    
    // Simpan ke database
    const { error } = await supabase
      .from('loot_history')
      .update({ proof_image: mockImageUrl })
      .eq('id', lootId);

    if (error) {
      console.error('Error updating proof image:', error.message);
      return;
    }

    setLoots((prev) =>
      prev.map((item) => (item.id === lootId ? { ...item, proof_image: mockImageUrl } : item))
    );
    if (selectedLoot?.id === lootId) {
      setSelectedLoot((prev) => ({ ...prev, proof_image: mockImageUrl }));
    }
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
                  <h3 className="font-bold text-slate-200">{item.boss_name}</h3>
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                    {item.attendees.length} Member
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.killed_at}</p>
                <p className="text-xs text-amber-400/90 font-medium mt-2 truncate">
                  💎 Drop: {item.dropped_items || 'Belum diisi'}
                </p>
              </div>
            ))}
          </div>

          {/* Kolom Kanan: Detail Loot & Bukti Screenshot */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            {/* Header Detail */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-100">{selectedLoot.boss_name}</h2>
                <p className="text-xs text-slate-400">{selectedLoot.killed_at}</p>
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

              {selectedLoot.proof_image ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-64">
                  <img
                    src={selectedLoot.proof_image}
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
                {selectedLoot.dropped_items}
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