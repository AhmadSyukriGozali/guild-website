'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Users, Clock, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [guildData, setGuildData] = useState([]);
  const [stats, setStats] = useState({ members: 0, online: 0, bosses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Ambil Session & Profile
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);

        // Ambil profile dari tabel profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }

      // 2. Ambil data anggota dari tabel profiles
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching members:', membersError.message);
      } else {
        setGuildData(membersData || []);
        
        // Hitung statistik
        const totalMembers = membersData?.length || 0;
        const staffCount = membersData?.filter(m => ['officer', 'guild_master'].includes(m.role)).length || 0;
        setStats(prev => ({ ...prev, members: totalMembers, online: staffCount }));
      }

      // 3. Ambil jumlah boss dari tracker
      const { count: bossCount, error: bossError } = await supabase
        .from('boss_tracker')
        .select('*', { count: 'exact', head: true });

      if (!bossError) {
        setStats(prev => ({ ...prev, bosses: bossCount || 0 }));
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400">Memuat data dari Supabase...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User Guild';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150';
  const userRole = profile?.role || 'guest';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Profil User */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 flex flex-wrap items-center gap-4">
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover"
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {displayName}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              userRole === 'guild_master' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
              userRole === 'officer' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              userRole === 'member' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              'bg-slate-800 text-slate-400'
            }`}>
              {userRole.replace('_', ' ')}
            </span>
          </h2>
          <p className="text-sm text-slate-400">{profile?.email || user?.email}</p>
          <span className="inline-block mt-2 text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg">
            Provider: {profile?.provider || user?.app_metadata?.provider || 'email'}
          </span>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Anggota</p>
            <p className="text-2xl font-bold">{stats.members}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Staff Aktif</p>
            <p className="text-2xl font-bold">{stats.online}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Boss Tracker</p>
            <p className="text-2xl font-bold">{stats.bosses}</p>
          </div>
        </div>
      </div>

      {/* Data Anggota dari Database */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Daftar Anggota Guild
        </h3>
        
        {guildData.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-700" />
            <p className="font-semibold">Belum ada anggota guild.</p>
            <p className="text-xs">Anggota akan muncul setelah login pertama kali.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {guildData.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                <img 
                  src={item.avatar_url || 'https://via.placeholder.com/40'} 
                  alt={item.username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-200 truncate">{item.username || 'Tanpa Nama'}</h4>
                  <p className="text-xs text-slate-500 truncate">{item.ign || item.email || ''}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  item.role === 'guild_master' ? 'bg-amber-400/10 text-amber-400' :
                  item.role === 'officer' ? 'bg-indigo-500/10 text-indigo-400' :
                  item.role === 'member' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {item.role?.replace('_', ' ') || 'Guest'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
