'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Timer, 
  Coins, 
  Users, 
  Calendar, 
  Image as GalleryIcon, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({ userProfile: initialProfile }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState(initialProfile);

  // Jika userProfile berubah (dari parent), update state
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    } else {
      // Fallback: ambil dari session/profile Supabase langsung
      fetchProfile();
    }
  }, [initialProfile]);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) setProfile(data);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('guild_master_passkey');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Boss Tracker', href: '/tracker', icon: Timer },
    { label: 'Boss Looting', href: '/looting', icon: Coins },
    { label: 'Guild Roster', href: '/roster', icon: Users },
    { label: 'Events & Calendar', href: '/events', icon: Calendar },
    { label: 'Gallery', href: '/gallery', icon: GalleryIcon },
  ];

  // Tambah menu Admin jika user adalah Officer / GM
  if (profile && ['guild_master', 'officer'].includes(profile?.role)) {
    navItems.push({ label: 'Admin Panel', href: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Logo / Header Sidebar */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-base">Guild Manager</h2>
            <span className="text-xs text-emerald-400 font-medium">● Server Online</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profil Ringkas & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile?.username || 'Member'}</p>
            <p className="text-xs text-amber-400 capitalize font-mono">
              {profile?.role?.replace('_', ' ') || 'Member'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar (Logout)
        </button>
      </div>
    </aside>
  );
}
