'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

import {
  ShieldCheck,
  KeyRound,
  Lock,
  Globe,
  Save,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserPlus,
  Check,
  X,
  Clock,
  Loader2,
} from 'lucide-react';

export default function AdminPanelPage() {
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [guildName, setGuildName] = useState('');

  const [emergencyLock, setEmergencyLock] =
    useState(false);

  const [currentPasskey, setCurrentPasskey] =
    useState('');

  const [newPasskey, setNewPasskey] =
    useState('');

  const [confirmPasskey, setConfirmPasskey] =
    useState('');

  const [pendingMembers, setPendingMembers] =
    useState([]);

  const [approvingId, setApprovingId] =
    useState(null);

  const [message, setMessage] = useState({
    type: '',
    text: '',
  });

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = '/login';
        return;
      }

      const { data: profileData } =
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

      if (!profileData) {
        window.location.href = '/dashboard';
        return;
      }

      if (
        profileData.role !== 'officer' &&
        profileData.role !== 'guild_master'
      ) {
        window.location.href = '/dashboard';
        return;
      }

      setProfile(profileData);

      const { data: settingData } =
        await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

      if (settingData) {
        setGuildName(
          settingData.guild_name || ''
        );

        setEmergencyLock(
          settingData.emergency_lock || false
        );
      }

      await loadPendingMembers();
    } catch (err) {
      console.error(err);

      setMessage({
        type: 'error',
        text: 'Gagal memuat data admin.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('updated_at', {
        ascending: false,
      });

    setPendingMembers(data || []);
  }

  function showMessage(type, text) {
    setMessage({
      type,
      text,
    });

    setTimeout(() => {
      setMessage({
        type: '',
        text: '',
      });
    }, 3000);
  }
  async function handleUpdatePasskey(e) {
    e.preventDefault();

    if (!newPasskey || !confirmPasskey) {
      showMessage(
        'error',
        'Semua kolom passkey wajib diisi.'
      );
      return;
    }

    if (newPasskey !== confirmPasskey) {
      showMessage(
        'error',
        'Konfirmasi passkey tidak sama.'
      );
      return;
    }

    const { error } = await supabase
      .from('app_settings')
      .update({
        master_passkey_hash: newPasskey,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq('id', 1);

    if (error) {
      showMessage(
        'error',
        error.message
      );
      return;
    }

    setCurrentPasskey('');
    setNewPasskey('');
    setConfirmPasskey('');

    showMessage(
      'success',
      'Master Passkey berhasil diperbarui.'
    );
  }

  async function handleSaveGuildName() {
    const { error } = await supabase
      .from('app_settings')
      .update({
        guild_name: guildName,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq('id', 1);

    if (error) {
      showMessage(
        'error',
        error.message
      );
      return;
    }

    showMessage(
      'success',
      'Nama Guild berhasil diperbarui.'
    );
  }

  async function handleToggleLock() {
    const newValue = !emergencyLock;

    const { error } = await supabase
      .from('app_settings')
      .update({
        emergency_lock: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      showMessage(
        'error',
        error.message
      );
      return;
    }

    setEmergencyLock(newValue);

    showMessage(
      'success',
      newValue
        ? 'Emergency Lock diaktifkan.'
        : 'Emergency Lock dimatikan.'
    );
  }

  async function approveMember(member) {
    setApprovingId(member.id);

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'member',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    setApprovingId(null);

    if (error) {
      showMessage(
        'error',
        error.message
      );
      return;
    }

    showMessage(
      'success',
      `${member.username} berhasil disetujui.`
    );

    loadPendingMembers();
  }

  async function rejectMember(member) {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    if (error) {
      showMessage(
        'error',
        error.message
      );
      return;
    }

    showMessage(
      'success',
      `${member.username} ditolak.`
    );

    loadPendingMembers();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex">
        <Sidebar userProfile={profile} />

        <div className="flex-1 flex justify-center items-center">

          <div className="flex items-center gap-3">

            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />

            <p className="text-slate-300">
              Memuat Admin Panel...
            </p>

          </div>

        </div>

      </div>
    );
  }
}