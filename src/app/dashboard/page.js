'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Clock,
  Activity,
  LogOut,
  UserCheck,
  KeyRound,
  Loader2,
  BadgeInfo,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [guildData, setGuildData] = useState([]);
  const [stats, setStats] = useState({
    members: 0,
    pending: 0,
    staff: 0,
    bosses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        } else if (profileData) {
          setProfile(profileData);
        }

        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .order('joined_at', { ascending: false });

        if (membersError) {
          console.error('Error fetching members:', membersError.message);
        } else {
          const members = membersData || [];
          setGuildData(members);

          const approvedMembers = members.filter((m) =>
            ['member', 'officer', 'guild_master'].includes(m.role)
          ).length;

          const pendingMembers = members.filter((m) => m.status === 'pending')
            .length;

          const staffCount = members.filter((m) =>
            ['officer', 'guild_master'].includes(m.role)
          ).length;

          setStats((prev) => ({
            ...prev,
            members: approvedMembers,
            pending: pendingMembers,
            staff: staffCount,
          }));
        }

        const { count: bossCount, error: bossError } = await supabase
          .from('boss_tracker')
          .select('*', { count: 'exact', head: true });

        if (!bossError) {
          setStats((prev) => ({
            ...prev,
            bosses: bossCount || 0,
          }));
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleApplyMember = async () => {
    try {
      setActionLoading('member');
      setActionError('');

      const res = await fetch('/api/apply-member', {
        method: 'POST',
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        setActionError(result.error || 'Gagal mengajukan member.');
        return;
      }

      setProfile((prev) => (prev ? { ...prev, status: 'pending' } : prev));
    } catch {
      setActionError('Gagal terhubung ke server.');
    } finally {
      setActionLoading('');
    }
  };

  const handleVerifyStaff = () => {
    router.push('/verify-staff');
  };

  const handleLogout = async () => {
    setActionLoading('logout');
    setActionError('');

    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setActionError('Gagal logout. Coba lagi.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-slate-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'User Guild';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    'https://via.placeholder.com/150';

  const userRole = profile?.role || 'guest';
  const userStatus = profile?.status || 'guest';

  const roleBadgeClass =
    userRole === 'guild_master'
      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
      : userRole === 'officer'
        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        : userRole === 'member'
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-slate-800 text-slate-400 border border-slate-700';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Guild Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Status akun: {userRole.replace('_', ' ')} / {userStatus}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={actionLoading === 'logout'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            {actionLoading === 'logout' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logout...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Logout
              </>
            )}
          </button>
        </div>

        {actionError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {actionError}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-4">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold flex flex-wrap items-center gap-2">
              {displayName}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadgeClass}`}>
                {userRole.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-sm text-slate-400">{profile?.email || user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg">
                <BadgeInfo className="w-3.5 h-3.5" />
                Provider: {profile?.provider || user?.app_metadata?.provider || 'email'}
              </span>
              {profile?.status === 'pending' && (
                <span className="inline-flex items-center gap-2 text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu persetujuan
                </span>
              )}
            </div>
          </div>
        </div>

        {(userRole === 'guest' || userRole === 'member') && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-200">
              Apakah kamu Staff / GM?
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Kalau bukan staff, ajukan member dulu. Kalau staff/GM, lanjut verifikasi passkey.
            </p>

            {profile?.status === 'pending' && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                Pengajuan member kamu sedang menunggu persetujuan Staff.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleApplyMember}
                disabled={actionLoading === 'member' || profile?.status === 'pending'}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 font-semibold text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-60"
              >
                {actionLoading === 'member' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengajukan...
                  </>
                ) : profile?.status === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    Sudah Pending
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Saya Member
                  </>
                )}
              </button>

              <button
                onClick={handleVerifyStaff}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-3 font-semibold text-indigo-400 hover:bg-indigo-500/15"
              >
                <KeyRound className="w-4 h-4" />
                Saya Staff / GM
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Member Aktif</p>
              <p className="text-2xl font-bold">{stats.members}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Pending Approval</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Staff Aktif</p>
              <p className="text-2xl font-bold">{stats.staff}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Boss Tracker</p>
              <p className="text-2xl font-bold">{stats.bosses}</p>
            </div>
          </div>
        </div>

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
              {guildData.map((item) => {
                const itemRole = item.role || 'guest';
                const itemStatus = item.status || 'guest';

                const itemRoleClass =
                  itemRole === 'guild_master'
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : itemRole === 'officer'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : itemRole === 'member'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700';

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3"
                  >
                    <img
                      src={item.avatar_url || 'https://via.placeholder.com/40'}
                      alt={item.username}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-200 truncate">
                        {item.username || 'Tanpa Nama'}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {item.ign || item.email || ''}
                      </p>
                      <p className="text-[11px] text-slate-600 truncate mt-1">
                        Status: {itemStatus}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${itemRoleClass}`}>
                      {itemRole.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}