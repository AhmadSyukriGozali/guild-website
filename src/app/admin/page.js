'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/admin/LoadingScreen';
import AdminHeader from '@/components/admin/AdminHeader';
import MessageAlert from '@/components/admin/MessageAlert';
import GuildSettingsCard from '@/components/admin/GuildSettingsCard';
import PendingMembersCard from '@/components/admin/PendingMembersCard';
import MemberManagementCard from '@/components/admin/MemberManagementCard';
import DashboardStats from '@/components/admin/DashboardStats';
import useAdmin from '@/hooks/useAdmin';

import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [settings, setSettings] = useState(null);

  const [pendingMembers, setPendingMembers] = useState([]);

  const [members, setMembers] = useState([]);
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    officers: 0,
    guildMasters: 0,
    bannedMembers: 0,
  });

  const [message, setMessage] = useState({
    type: '',
    text: '',
  });

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        router.replace('/dashboard');
        return;
      }

      if (
        profileData.role !== 'officer' &&
        profileData.role !== 'guild_master'
      ) {
        router.replace('/dashboard');
        return;
      }

      setProfile(profileData);

      await loadSettings();

      await loadPendingMembers();
    } catch (err) {
      console.error(err);

      setMessage({
        type: 'error',
        text: 'Gagal memuat Admin Panel.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    const res = await fetch('/api/admin/settings');

    const result = await res.json();

    if (!res.ok || !result.ok) {
      throw new Error(result.error);
    }

    setSettings(result.settings);
  }

  async function loadPendingMembers() {
    const res = await fetch('/api/admin/get-pending-members');

    const result = await res.json();

    if (!res.ok || !result.ok) {
      throw new Error(result.error);
    }

    setPendingMembers(result.members);
  }

  async function loadMembers() {
    try {
      const res = await fetch('/api/admin/get-members');

      const result = await res.json();

      if (!res.ok || !result.ok) {
        showMessage(
          'error',
          result.error || 'Gagal mengambil data member.'
        );
        return;
      }

      setMembers(result.members || []);

    } catch (err) {
      console.error(err);

      showMessage(
        'error',
        'Gagal mengambil data member.'
      );
    }
  }
  
  async function loadDashboardStats() {

    try {

      const res = await fetch('/api/admin/dashboard-stats');

      const result = await res.json();

      if (!res.ok || !result.ok) {
        return;
      }

      setStats(result.stats);

    } catch (err) {

      console.error(err);

    }

  }
  
  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace('/login');
  }
  async function refreshPendingMembers() {
    await Promise.all([
      loadPendingMembers(),
      loadMembers(),
      loadDashboardStats(),
    ]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex">
        <Sidebar userProfile={profile} />
        <LoadingScreen text="Memuat Admin Panel..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar userProfile={profile} />

      <main className="flex-1 p-8">

        <AdminHeader
          profile={profile}
          onLogout={handleLogout}
        />
        <DashboardStats stats={stats} />  

        <MessageAlert message={message} />

        <GuildSettingsCard />

        <div className="mt-8">

          <MemberManagementCard
            members={members}
            onRefresh={async () => {
              await loadMembers();
              await loadPendingMembers();
            }}
          />

        </div>
      </main>
    </div>
  );
}
