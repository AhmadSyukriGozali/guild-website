'use client';

import { useEffect, useState } from 'react';

import {
    Globe,
    Lock,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

export default function GuildSettingsCard() {

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState(null);

    const [guildName, setGuildName] = useState('');

    const [emergencyLock, setEmergencyLock] =
        useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {

        try {

            setLoading(true);

            const res = await fetch(
                '/api/admin/settings'
            );

            const result = await res.json();

            if (!res.ok || !result.ok) {

                setMessage({
                    type: 'error',
                    text: result.error,
                });

                return;
            }

            setGuildName(
                result.settings.guild_name || ''
            );

            setEmergencyLock(
                result.settings.emergency_lock || false
            );

        } catch (err) {

            console.error(err);

            setMessage({
                type: 'error',
                text: 'Gagal mengambil data.',
            });

        } finally {

            setLoading(false);

        }

    }

    async function handleSave() {

        try {

            setSaving(true);

            setMessage(null);

            const res = await fetch(
                '/api/admin/update-settings',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify({
                        guild_name: guildName,
                        emergency_lock:
                            emergencyLock,
                    }),
                }
            );

            const result = await res.json();

            if (!res.ok || !result.ok) {

                setMessage({
                    type: 'error',
                    text: result.error,
                });

                return;

            }

            setMessage({
                type: 'success',
                text: 'Pengaturan berhasil disimpan.',
            });

        } catch (err) {

            console.error(err);

            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan.',
            });

        } finally {

            setSaving(false);

        }

    }

    if (loading) {

        return (

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex justify-center py-10">

                    <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />

                </div>

            </div>

        );

    }

    return (

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-bold mb-6">

                Guild Settings

            </h2>

            {message && (

                <div
                    className={`mb-5 rounded-xl p-3 flex items-center gap-2 ${message.type === 'success'
                            ? 'bg-green-900/30 border border-green-700 text-green-300'
                            : 'bg-red-900/30 border border-red-700 text-red-300'
                        }`}
                >

                    {message.type === 'success' ? (

                        <CheckCircle2 className="w-5 h-5" />

                    ) : (

                        <AlertTriangle className="w-5 h-5" />

                    )}

                    {message.text}

                </div>

            )}

            <div className="space-y-6">

                <div>

                    <label className="flex items-center gap-2 mb-2 text-sm text-slate-400">

                        <Globe className="w-4 h-4" />

                        Nama Guild

                    </label>

                    <input
                        value={guildName}
                        onChange={(e) =>
                            setGuildName(e.target.value)
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
                    />

                </div>

                <div className="rounded-xl border border-slate-700 p-4 flex items-center justify-between">

                    <div>

                        <h3 className="font-semibold flex items-center gap-2">

                            <Lock className="w-4 h-4" />

                            Emergency Lock

                        </h3>

                        <p className="text-sm text-slate-400 mt-1">

                            Menonaktifkan akses website
                            sementara.

                        </p>

                    </div>

                    <input
                        type="checkbox"
                        checked={emergencyLock}
                        onChange={(e) =>
                            setEmergencyLock(
                                e.target.checked
                            )
                        }
                    />

                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold flex items-center justify-center gap-2 transition"
                >

                    {saving ? (

                        <>

                            <Loader2 className="w-5 h-5 animate-spin" />

                            Menyimpan...

                        </>

                    ) : (

                        <>

                            <Save className="w-5 h-5" />

                            Simpan Pengaturan

                        </>

                    )}

                </button>

            </div>

        </div>

    );

}