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

import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [settings, setSettings] = useState(null);

  const [pendingMembers, setPendingMembers] = useState([]);

  const [members, setMembers] = useState([]);

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

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace('/login');
  }
  async function refreshPendingMembers() {
    await loadPendingMembers();
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

        <MessageAlert message={message} />

        <GuildSettingsCard
          settings={settings}
          onSaved={(newSettings) => {
            setSettings(newSettings);

            setMessage({
              type: 'success',
              text: 'Pengaturan berhasil disimpan.',
            });
          }}
        />
        <div className="mt-8">

          <PendingMembersCard
            members={pendingMembers}
            onRefresh={refreshPendingMembers}
          />

        </div>
      </main>
    </div>
  );
}
