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
import ActivityLogsCard from '@/components/admin/ActivityLogsCard';

import { supabase } from '@/lib/supabase';

export default function AdminPage() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [settings, setSettings] = useState(null);

  const [pendingMembers, setPendingMembers] = useState([]);

  const [members, setMembers] = useState([]);

  const [logs, setLogs] = useState([]);

  const [stats, setStats] = useState({
    members: 0,
    pending: 0,
    officers: 0,
    guildMasters: 0,
    bosses: 0,
    kills: 0,
    loots: 0,
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileData) {
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

      await refreshAll();

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

    if (result.ok) {
      setSettings(result.settings);
    }

  }

  async function loadMembers() {

    const res = await fetch('/api/admin/get-members');

    const result = await res.json();

    if (result.ok) {
      setMembers(result.members || []);
    }

  }

  async function loadPendingMembers() {

    const res = await fetch('/api/admin/get-pending-members');

    const result = await res.json();

    if (result.ok) {
      setPendingMembers(result.members || []);
    }

  }

  async function loadDashboardStats() {

    const res = await fetch('/api/admin/dashboard-stats');

    const result = await res.json();

    if (result.ok) {
      setStats(result.stats);
    }

  }

  async function loadActivityLogs() {

    const res = await fetch('/api/admin/activity-logs');

    const result = await res.json();

    if (result.ok) {
      setLogs(result.logs || []);
    }

  }

  async function refreshAll() {

    await Promise.all([
      loadSettings(),
      loadMembers(),
      loadPendingMembers(),
      loadDashboardStats(),
      loadActivityLogs(),
    ]);

  }

  async function handleLogout() {

    await supabase.auth.signOut();

    router.replace('/login');

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

        <div className="mt-6">

          <DashboardStats stats={stats} />

        </div>

        <MessageAlert message={message} />

        <div className="grid lg:grid-cols-2 gap-6 mt-6">

          <GuildSettingsCard
            settings={settings}
            onSaved={refreshAll}
          />

          <PendingMembersCard
            members={pendingMembers}
            onRefresh={refreshAll}
          />

        </div>

        <div className="mt-6">

          <MemberManagementCard
            members={members}
            onRefresh={refreshAll}
          />

        </div>

        <div className="mt-6">

          <ActivityLogsCard
            logs={logs}
            onRefresh={refreshAll}
          />

        </div>

      </main>

    </div>

  );

}