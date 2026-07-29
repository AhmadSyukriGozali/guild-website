'use client';

import {
    Users,
    UserCheck,
    Clock3,
    Shield,
    Crown,
    ShieldBan,
    SkullIcon,
    Skull,
    Backpack,
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
                value={stats.members ?? 0}
                icon={<Users size={34} />}
            />

            <StatCard
                title="Pending Member"
                value={stats.pending ?? 0}
                icon={<Clock3 size={34} />}
            />

            <StatCard
                title="Officer"
                value={stats.officers ?? 0}
                icon={<Shield size={34} />}
            />

            <StatCard
                title="Guild Master"
                value={stats.guildMasters ?? 0}
                icon={<Crown size={34} />}
            />

            <StatCard
                title="Boss"
                value={stats.bosses ?? 0}
                icon={<UserCheck size={34} />}
            />

            <StatCard
                title="Kills"
                value={stats.kills ?? 0}
                icon={<Skull size={34} />}
            />

            <StatCard
                title="Loot"
                value={stats.loots ?? 0}
                icon={<Backpack size={34} />}
            />

        </div>

    );
}