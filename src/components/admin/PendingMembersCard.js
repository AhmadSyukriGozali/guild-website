'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Loader2,
  Users,
} from 'lucide-react';

export default function PendingMembersCard({
  members,
  onRefresh,
}) {
  const [loadingId, setLoadingId] = useState(null);

  async function approveMember(id) {
    try {
      setLoadingId(id);

      const res = await fetch('/api/admin/approve-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.error);
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

  async function rejectMember(id) {
    try {
      setLoadingId(id);

      const res = await fetch('/api/admin/reject-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.error);
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

      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-indigo-400" />
        Pending Member
      </h2>

      {members.length === 0 && (
        <p className="text-slate-400">
          Tidak ada permintaan member.
        </p>
      )}

      <div className="space-y-4">

        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
          >

            <div className="flex items-center gap-4">

              <img
                src={member.avatar_url}
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
                  {member.provider}
                </p>

              </div>

            </div>

            <div className="flex gap-2">

              <button
                disabled={loadingId === member.id}
                onClick={() => approveMember(member.id)}
                className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2"
              >
                {loadingId === member.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>

              <button
                disabled={loadingId === member.id}
                onClick={() => rejectMember(member.id)}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}