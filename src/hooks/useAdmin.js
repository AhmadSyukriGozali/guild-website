'use client';

import { useState } from 'react';

export default function useAdmin() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    officers: 0,
    guildMasters: 0,
    bannedMembers: 0,
  });

  const [members, setMembers] = useState([]);

  const [pendingMembers, setPendingMembers] = useState([]);

  const [settings, setSettings] = useState(null);

  async function loadDashboardStats() {
    const res = await fetch('/api/admin/dashboard-stats');
    const result = await res.json();

    if (res.ok && result.ok) {
      setStats(result.stats);
    }
  }

  async function loadMembers() {
    const res = await fetch('/api/admin/get-members');
    const result = await res.json();

    if (res.ok && result.ok) {
      setMembers(result.members);
    }
  }

  async function loadPendingMembers() {
    const res = await fetch('/api/admin/get-pending-members');
    const result = await res.json();

    if (res.ok && result.ok) {
      setPendingMembers(result.members);
    }
  }

  async function loadSettings() {
    const res = await fetch('/api/admin/settings');
    const result = await res.json();

    if (res.ok && result.ok) {
      setSettings(result.settings);
    }
  }

  async function refreshAll() {
    await Promise.all([
      loadDashboardStats(),
      loadMembers(),
      loadPendingMembers(),
      loadSettings(),
    ]);
  }

  return {
    stats,
    members,
    pendingMembers,
    settings,

    loadDashboardStats,
    loadMembers,
    loadPendingMembers,
    loadSettings,
    refreshAll,
  };
}