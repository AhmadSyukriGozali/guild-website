'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, Check, X, Shield, Search, Filter } from 'lucide-react';

export default function GuildRosterPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [searchQuery, setSearchQuery] = useState('');

  // Data dari database
  const [members, setMembers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Ambil data dari Supabase
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

      // Ambil semua profile dari database
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error.message);
      } else if (allProfiles) {
        // Pisahkan member aktif (member, officer, guild_master) dan pending (guest)
        const activeMembers = allProfiles.filter(p => p.role !== 'guest');
        const pending = allProfiles.filter(p => p.role === 'guest');
        
        setMembers(activeMembers);
        setPendingUsers(pending);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const isStaffOrGM = profile && ['guild_master', 'officer'].includes(profile.role);

  // Handle Approve Member
  const handleApprove = async (user) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'member' })
      .eq('id', user.id);

    if (error) {
      console.error('Error approving member:', error.message);
      return;
    }

    setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
    setMembers((prev) => [
      ...prev,
      { ...user, role: 'member' },
    ]);
  };

  // Handle Reject Member (delete profile)
  const handleReject = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error rejecting member:', error.message);
      return;
    }

    setPendingUsers((prev) => prev.filter((p) => p.id !== userId));
  };

  // Filter Search
  const filteredMembers = members.filter(
    (m) =>
      m.ign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.gameClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigasi */}
      <Sidebar userProfile={profile} />

      {/* Konten Utama */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-400" />
              Guild Roster & Members
            </h1>
            <p className="text-slate-400 text-sm">
              Kelola seluruh anggota guild dan acc pendaftar baru yang berstatus pending.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Member Aktif ({members.length})
            </button>

            {isStaffOrGM && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'pending'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Pendaftar Pending ({pendingUsers.length})
                {pendingUsers.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Member Aktif */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nickname / Class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Table Roster */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">In-Game Name (IGN)</th>
                    <th className="px-6 py-4">Class / Job</th>
                    <th className="px-6 py-4">Role Guild</th>
                    <th className="px-6 py-4">Tgl Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                          {member.ign[0].toUpperCase()}
                        </div>
                        {member.ign}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{member.gameClass}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            member.role === 'guild_master'
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : member.role === 'officer'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{member.joinedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Moderasi Pendaftar (Staff / GM Only) */}
        {activeTab === 'pending' && isStaffOrGM && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400">
              Daftar Calon Member Menunggu Persetujuan
            </h2>

            {pendingUsers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-300">Tidak ada pendaftar baru saat ini.</p>
                <p className="text-xs">Semua permintaan persetujuan telah diproses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{user.ign}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Class: {user.gameClass}</p>
                      <p className="text-xs text-indigo-400 font-mono mt-2">Mendaftar: {user.requestedAt}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(user)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                        title="ACC / Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleReject(user.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20"
                        title="Tolak / Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}