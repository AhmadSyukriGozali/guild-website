import {
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function AdminHeader({
  profile,
  onLogout
}) {
  return (
    <div className="flex items-center justify-between mb-8">

      <div>

        <h1 className="text-3xl font-bold flex items-center gap-3">

          <ShieldCheck className="w-8 h-8 text-indigo-400" />

          Admin Panel

        </h1>

        <p className="text-slate-400 mt-2">

          Selamat datang,

          <span className="font-semibold ml-1">

            {profile?.username}

          </span>

        </p>

      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 transition"
      >

        <LogOut className="w-5 h-5" />

        Logout

      </button>

    </div>
  );
}