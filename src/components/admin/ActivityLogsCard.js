'use client';

import { History } from 'lucide-react';

export default function ActivityLogsCard({
  logs = [],
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">

        <History className="w-5 h-5 text-indigo-400" />

        Activity Logs

      </h2>

      {logs.length === 0 && (

        <p className="text-slate-400">

          Belum ada aktivitas.

        </p>

      )}

      <div className="space-y-4">

        {logs.map((log) => (

          <div
            key={log.id}
            className="border-b border-slate-800 pb-3"
          >

            <p className="text-sm">

              {log.description}

            </p>

            <p className="text-xs text-slate-500 mt-1">

              {new Date(log.created_at).toLocaleString()}

            </p>

          </div>

        ))}

      </div>

    </div>
  );
}