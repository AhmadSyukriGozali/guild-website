'use client';

import { useState } from 'react';
import {
  Globe,
  Lock,
  Save,
  Loader2,
} from 'lucide-react';

export default function GuildSettingsCard({
  settings,
  onSaved,
}) {
  const [guildName, setGuildName] = useState(
    settings?.guild_name || ''
  );

  const [emergencyLock, setEmergencyLock] =
    useState(settings?.emergency_lock || false);

  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      const res = await fetch(
        '/api/admin/update-settings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guild_name: guildName,
            emergency_lock: emergencyLock,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.error);
        return;
      }

      if (onSaved) {
        onSaved(result.settings);
      }

      alert('Pengaturan berhasil disimpan.');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="text-xl font-bold mb-6">
        Guild Settings
      </h2>

      <div className="space-y-5">

        <div>

          <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">

            <Globe className="w-4 h-4" />

            Nama Guild

          </label>

          <input
            value={guildName}
            onChange={(e) =>
              setGuildName(e.target.value)
            }
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3"
          />

        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-700 p-4">

          <div>

            <p className="font-semibold flex items-center gap-2">

              <Lock className="w-4 h-4" />

              Emergency Lock

            </p>

            <p className="text-sm text-slate-400">

              Nonaktifkan akses guild sementara.

            </p>

          </div>

          <input
            type="checkbox"
            checked={emergencyLock}
            onChange={(e) =>
              setEmergencyLock(e.target.checked)
            }
          />

        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold flex items-center justify-center gap-2"
        >

          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </>
          )}

        </button>

      </div>

    </div>
  );
}