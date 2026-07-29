'use client';

import {
  Users,
  UserCheck,
  Clock3,
  Shield,
  Crown,
  ShieldBan,
} from 'lucide-react';

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">

            {title}

          </p>

          <h2 className="mt-2 text-3xl font-bold">

            {value}

          </h2>

        </div>

        <div className="text-indigo-400">

          {icon}

        </div>

      </div>

    </div>
  );
}

export default function DashboardStats({
  stats,
}) {
  return (

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      <StatCard
        title="Total Member"
        value={stats.totalMembers}
        icon={<Users size={34} />}
      />

      <StatCard
        title="Active Member"
        value={stats.activeMembers}
        icon={<UserCheck size={34} />}
      />

      <StatCard
        title="Pending"
        value={stats.pendingMembers}
        icon={<Clock3 size={34} />}
      />

      <StatCard
        title="Officer"
        value={stats.officers}
        icon={<Shield size={34} />}
      />

      <StatCard
        title="Guild Master"
        value={stats.guildMasters}
        icon={<Crown size={34} />}
      />

      <StatCard
        title="Banned"
        value={stats.bannedMembers}
        icon={<ShieldBan size={34} />}
      />

    </div>

  );
}