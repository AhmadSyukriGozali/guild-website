'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Save,
  ShieldBan,
  ShieldCheck,
  Users,
  Loader2,
} from 'lucide-react';

export default function MemberManagementCard({
  members,
  onRefresh,
}) {
  const [keyword, setKeyword] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const text = `
        ${member.username || ''}
        ${member.email || ''}
        ${member.ign || ''}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [members, keyword]);

  async function saveRole(userId, role) {
    try {
      setLoadingId(userId);

      const status =
        role === 'guest'
          ? 'guest'
          : 'active';

      const res = await fetch('/api/admin/update-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
          status,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.error || 'Gagal mengubah role.');
        return;
      }

      await onRefresh();

    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setLoadingId(null);
    }
  }

  async function toggleBan(userId) {
    try {
      setLoadingId(userId);

      const res = await fetch('/api/admin/toggle-ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.error || 'Gagal mengubah status ban.');
        return;
      }

      await onRefresh();

    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-indigo-400" />
        Member Management
      </h2>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari username, email atau IGN..."
          className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-3"
        />
      </div>

      <div className="space-y-4">

        {filteredMembers.map((member) => (

          <MemberRow
            key={member.id}
            member={member}
            loading={loadingId === member.id}
            onSave={saveRole}
            onToggleBan={toggleBan}
          />

        ))}

      </div>

    </div>
  );
}

function MemberRow({
  member,
  loading,
  onSave,
  onToggleBan,
}) {

  const [role, setRole] = useState(member.role);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">

      <div className="flex items-center gap-4">

        <img
          src={member.avatar_url || '/default-avatar.png'}
          alt={member.username}
          className="w-12 h-12 rounded-full"
        />

        <div>

          <h3 className="font-semibold">
            {member.username}
          </h3>

          <p className="text-sm text-slate-400">
            {member.email}
          </p>

          <p className="text-xs text-slate-500">
            {member.status}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-3">

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
        >
          <option value="guest">Guest</option>
          <option value="member">Member</option>
          <option value="officer">Officer</option>
          <option value="guild_master">Guild Master</option>
        </select>

        <button
          disabled={loading}
          onClick={() => onSave(member.id, role)}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
        </button>

        <button
          disabled={loading}
          onClick={() => onToggleBan(member.id)}
          className={`rounded-lg px-4 py-2 disabled:opacity-50 ${
            member.is_banned
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading
            ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            )
            : member.is_banned
              ? (
                <ShieldCheck className="w-4 h-4" />
              )
              : (
                <ShieldBan className="w-4 h-4" />
              )}
        </button>

      </div>

    </div>
  );
}