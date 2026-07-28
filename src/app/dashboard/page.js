'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Clock,
  Activity,
  LogOut,
  UserCheck,
  KeyRound,
  Loader2,
  BadgeInfo,
  CheckCircle2,
  UserPlus,
  Crown,
  Timer,
  Coins,
  Calendar,
  Image as GalleryIcon,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [guildData, setGuildData] = useState([]);

  const [stats, setStats] = useState({
    members: 0,
    pending: 0,
    staff: 0,
    bosses: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            'Error mengambil session:',
            sessionError.message
          );
        }

        if (!session?.user) {
          router.replace('/login');
          return;
        }

        if (!isMounted) return;

        setUser(session.user);

        /*
         * Mengambil profil user yang sedang login.
         */
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            'Error mengambil profil:',
            profileError.message
          );
        }

        if (!isMounted) return;

        if (profileData) {
          setProfile(profileData);
        } else {
          /*
           * Jika profil belum ada, dashboard tetap berjalan.
           * User akan dianggap Guest.
           */
          setProfile(null);
        }

        /*
         * Mengambil daftar anggota yang sudah diterima.
         *
         * Guest dan user pending tidak ditampilkan
         * pada daftar anggota guild.
         */
        const {
          data: membersData,
          error: membersError,
        } = await supabase
          .from('profiles')
          .select(
            `
              id,
              username,
              email,
              ign,
              avatar_url,
              role,
              status,
              joined_at
            `
          )
          .in('role', [
            'member',
            'officer',
            'guild_master',
          ])
          .order('joined_at', {
            ascending: false,
          });

        if (membersError) {
          console.error(
            'Error mengambil anggota:',
            membersError.message
          );
        }

        if (!isMounted) return;

        const members = membersData || [];

        setGuildData(members);

        /*
         * Statistik anggota aktif.
         */
        const approvedMembers = members.filter((member) =>
          [
            'member',
            'officer',
            'guild_master',
          ].includes(member.role)
        ).length;

        /*
         * Statistik Staff.
         */
        const staffCount = members.filter((member) =>
          [
            'officer',
            'guild_master',
          ].includes(member.role)
        ).length;

        /*
         * Pending tetap dihitung dari seluruh profil.
         *
         * Catatan:
         * Jika RLS membatasi Guest membaca seluruh profiles,
         * query ini kemungkinan akan gagal.
         * Nantinya statistik global lebih aman dipindahkan
         * ke API Route server.
         */
        const {
          count: pendingCount,
          error: pendingError,
        } = await supabase
          .from('profiles')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'pending');

        if (pendingError) {
          console.error(
            'Error menghitung pending:',
            pendingError.message
          );
        }

        /*
         * Menghitung jumlah boss pada boss tracker.
         */
        const {
          count: bossCount,
          error: bossError,
        } = await supabase
          .from('boss_tracker')
          .select('*', {
            count: 'exact',
            head: true,
          });

        if (bossError) {
          console.error(
            'Error menghitung boss:',
            bossError.message
          );
        }

        if (!isMounted) return;

        setStats({
          members: approvedMembers,
          pending: pendingCount || 0,
          staff: staffCount,
          bosses: bossCount || 0,
        });
      } catch (error) {
        console.error(
          'Dashboard load error:',
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  /*
   * Guest mengajukan diri menjadi Member.
   */
  const handleApplyMember = async () => {
    try {
      setActionLoading(
        'member'
      );

      setActionError(
        ''
      );

      /*
       * Ambil sesi terbaru dari Supabase.
       */
      const {
        data: {
          session,
        },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {
        setActionError(
          'Sesi login tidak ditemukan. Silakan login kembali.'
        );

        return;
      }

      /*
       * Kirim access token ke API.
       */
      const response =
        await fetch(
          '/api/apply-member',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        setActionError(
          result.error ||
          'Gagal mengajukan Member.'
        );

        return;
      }

      /*
       * Ubah tampilan langsung menjadi Pending
       * tanpa perlu refresh halaman.
       */
      setProfile(
        (
          previousProfile
        ) => {
          if (
            !previousProfile
          ) {
            return {
              id:
                session.user.id,

              role:
                'guest',

              status:
                'pending',
            };
          }

          return {
            ...previousProfile,

            status:
              'pending',
          };
        }
      );
    } catch (error) {
      console.error(
        'Error mengajukan Member:',
        error
      );

      setActionError(
        'Gagal terhubung ke server.'
      );
    } finally {
      setActionLoading(
        ''
      );
    }
  };

  /*
   * User menuju halaman verifikasi Staff / GM.
   */
  const handleVerifyStaff = () => {
    router.push(
      '/verify-staff'
    );
  };

  /*
   * Logout.
   */
  const handleLogout = async () => {
    try {
      setActionLoading('logout');
      setActionError('');

      const {
        error,
      } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace('/login');
    } catch (error) {
      console.error(
        'Error logout:',
        error
      );

      setActionError(
        'Gagal logout. Coba lagi.'
      );
    } finally {
      setActionLoading('');
    }
  };

  /*
   * Tampilan ketika data masih dimuat.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />

          <p className="text-slate-400">
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Data tampilan user.
   */
  const displayName =
    profile?.username ||
    user?.user_metadata
      ?.full_name ||
    user?.user_metadata
      ?.name ||
    user?.email
      ?.split('@')[0] ||
    'User Guild';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata
      ?.avatar_url ||
    user?.user_metadata
      ?.picture ||
    '';

  /*
   * Default role dan status.
   */
  const userRole =
    profile?.role ||
    'guest';

  const userStatus =
    profile?.status ||
    'guest';

  /*
   * Role utama.
   */
  const isGuest =
    userRole === 'guest';

  const isMember =
    userRole === 'member';

  const isOfficer =
    userRole === 'officer';

  const isGuildMaster =
    userRole ===
    'guild_master';

  const isStaff =
    isOfficer ||
    isGuildMaster;

  const isPending =
    userStatus ===
    'pending';

  const isApproved =
    [
      'approved',
      'active',
      'member',
    ].includes(
      userStatus
    );

  /*
   * Warna badge role.
   */
  const roleBadgeClass =
    isGuildMaster
      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
      : isOfficer
        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        : isMember
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-slate-800 text-slate-400 border border-slate-700';

  /*
   * Label role.
   */
  const roleLabel =
    userRole
      .replaceAll(
        '_',
        ' '
      );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Guild Dashboard
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              Status akun:
              {' '}
              <span className="capitalize">
                {roleLabel}
              </span>
              {' / '}
              <span className="capitalize">
                {userStatus}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              actionLoading ===
              'logout'
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            {actionLoading ===
              'logout' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />

                Logout...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />

                Logout
              </>
            )}
          </button>
        </header>

        {/* ERROR */}

        {actionError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {actionError}
          </div>
        )}

        {/* PROFIL USER */}

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-4">

          {avatarUrl ? (
            <img
              src={
                avatarUrl
              }
              alt={
                displayName
              }
              className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500 bg-indigo-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>
          )}

          <div className="flex-1">

            <h2 className="text-xl font-bold flex flex-wrap items-center gap-2">

              {displayName}

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadgeClass}`}
              >
                {roleLabel}
              </span>

            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {
                profile?.email ||
                user?.email
              }
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              <span className="inline-flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg">

                <BadgeInfo className="w-3.5 h-3.5" />

                Provider:
                {' '}
                {
                  profile?.provider ||
                  user?.app_metadata
                    ?.provider ||
                  'email'
                }

              </span>

              {isPending && (

                <span className="inline-flex items-center gap-2 text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">

                  <Clock className="w-3.5 h-3.5" />

                  Menunggu persetujuan

                </span>

              )}

              {isApproved && (

                <span className="inline-flex items-center gap-2 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg">

                  <CheckCircle2 className="w-3.5 h-3.5" />

                  Akun disetujui

                </span>

              )}

            </div>

          </div>

        </section>

        {/* PANEL KHUSUS GUEST */}

        {isGuest && (

          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">

            <div className="flex items-start gap-3">

              <div className="p-3 rounded-xl bg-indigo-500/10">

                <Shield className="w-6 h-6 text-indigo-400" />

              </div>

              <div>

                <h3 className="text-lg font-semibold text-slate-100">

                  Akses Akun Guest

                </h3>

                <p className="text-sm text-slate-400 mt-1">

                  Pilih pengajuan sesuai status kamu di dalam guild.

                </p>

              </div>

            </div>

            {isPending ? (

              <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">

                <div className="flex items-center gap-2 text-amber-300 font-semibold">

                  <Clock className="w-5 h-5" />

                  Pengajuan sedang diproses

                </div>

                <p className="text-sm text-amber-200/70 mt-2">

                  Staff atau Guild Master
                  harus menyetujui pengajuan
                  kamu sebelum akses Member
                  dibuka.

                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

                <button
                  type="button"
                  onClick={
                    handleApplyMember
                  }
                  disabled={
                    actionLoading ===
                    'member'
                  }
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3.5 font-semibold text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-60"
                >

                  {actionLoading ===
                    'member' ? (

                    <>

                      <Loader2 className="w-4 h-4 animate-spin" />

                      Mengajukan...

                    </>

                  ) : (

                    <>

                      <UserPlus className="w-4 h-4" />

                      Ajukan Menjadi Member

                    </>

                  )}

                </button>

                <button
                  type="button"
                  onClick={
                    handleVerifyStaff
                  }
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-3.5 font-semibold text-indigo-400 hover:bg-indigo-500/15"
                >

                  <KeyRound className="w-4 h-4" />

                  Saya Staff / GM

                </button>

              </div>

            )}

          </section>

        )}

        {/* PANEL MEMBER */}

        {isMember && (

          <section className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl">

            <div className="flex items-start gap-3">

              <div className="p-3 rounded-xl bg-emerald-500/10">

                <UserCheck className="w-6 h-6 text-emerald-400" />

              </div>

              <div>

                <h3 className="text-lg font-semibold text-emerald-300">

                  Akses Member Aktif

                </h3>

                <p className="text-sm text-slate-400 mt-1">

                  Akun kamu sudah terdaftar
                  sebagai Member guild.

                  Fitur Member akan ditambahkan
                  pada tahap berikutnya.

                </p>

              </div>

            </div>

          </section>

        )}

        {/* PANEL STAFF */}

        {isStaff && (

          <section className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl">

            <div className="flex items-start gap-3">

              <div className="p-3 rounded-xl bg-indigo-500/10">

                {isGuildMaster ? (

                  <Crown className="w-6 h-6 text-amber-400" />

                ) : (

                  <Shield className="w-6 h-6 text-indigo-400" />

                )}

              </div>

              <div>

                <h3 className="text-lg font-semibold text-indigo-300">

                  Panel Staff

                </h3>

                <p className="text-sm text-slate-400 mt-1">

                  Akun kamu memiliki akses
                  Staff.

                  Menu persetujuan Member dan
                  pengelolaan guild akan
                  ditambahkan setelah dashboard
                  Guest selesai.

                </p>

              </div>

            </div>

          </section>

        )}

        {/* NAVIGASI FITUR */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => router.push('/tracker')}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Boss Tracker</p>
              <p className="text-xs text-slate-500">Catat spawn & absensi boss</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/looting')}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Boss Looting</p>
              <p className="text-xs text-slate-500">Riwayat loot & drop item</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/roster')}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left"
          >
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Guild Roster</p>
              <p className="text-xs text-slate-500">Daftar anggota & pending</p>
            </div>
          </button>

          {isStaff && (
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left"
            >
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Admin Panel</p>
                <p className="text-xs text-slate-500">Pengaturan guild & approve member</p>
              </div>
            </button>
          )}
        </section>

        {/* STATISTIK */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">

            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">

              <Users className="w-6 h-6" />

            </div>

            <div>

              <p className="text-xs text-slate-400 font-medium">

                Member Aktif

              </p>

              <p className="text-2xl font-bold">

                {stats.members}

              </p>

            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">

            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">

              <Clock className="w-6 h-6" />

            </div>

            <div>

              <p className="text-xs text-slate-400 font-medium">

                Pending Approval

              </p>

              <p className="text-2xl font-bold">

                {stats.pending}

              </p>

            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">

            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">

              <Activity className="w-6 h-6" />

            </div>

            <div>

              <p className="text-xs text-slate-400 font-medium">

                Staff Aktif

              </p>

              <p className="text-2xl font-bold">

                {stats.staff}

              </p>

            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">

            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">

              <Shield className="w-6 h-6" />

            </div>

            <div>

              <p className="text-xs text-slate-400 font-medium">

                Boss Tracker

              </p>

              <p className="text-2xl font-bold">

                {stats.bosses}

              </p>

            </div>

          </div>

        </section>

        {/* DAFTAR ANGGOTA */}

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">

          <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">

            <Shield className="w-5 h-5 text-indigo-400" />

            Daftar Anggota Guild

          </h3>

          {guildData.length ===
            0 ? (

            <div className="text-center py-10 text-slate-500 space-y-2">

              <Users className="w-12 h-12 mx-auto text-slate-700" />

              <p className="font-semibold">

                Belum ada anggota aktif.

              </p>

              <p className="text-xs">

                Anggota akan muncul setelah
                disetujui oleh Staff.

              </p>

            </div>

          ) : (

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">

              {guildData.map(
                (item) => {

                  const itemRole =
                    item.role ||
                    'guest';

                  const itemStatus =
                    item.status ||
                    'unknown';

                  const itemRoleClass =
                    itemRole ===
                      'guild_master'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : itemRole ===
                        'officer'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : itemRole ===
                          'member'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700';

                  return (

                    <article
                      key={
                        item.id
                      }
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3"
                    >

                      {item.avatar_url ? (

                        <img
                          src={
                            item.avatar_url
                          }
                          alt={
                            item.username ||
                            'Avatar anggota'
                          }
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />

                      ) : (

                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">

                          <Users className="w-4 h-4 text-slate-500" />

                        </div>

                      )}

                      <div className="flex-1 min-w-0">

                        <h4 className="font-bold text-slate-200 truncate">

                          {
                            item.username ||
                            'Tanpa Nama'
                          }

                        </h4>

                        <p className="text-xs text-slate-500 truncate">

                          {
                            item.ign ||
                            item.email ||
                            ''
                          }

                        </p>

                        <p className="text-[11px] text-slate-600 truncate mt-1">

                          Status:
                          {' '}
                          {
                            itemStatus
                          }

                        </p>

                      </div>

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${itemRoleClass}`}
                      >

                        {
                          itemRole
                            .replaceAll(
                              '_',
                              ' '
                            )
                        }

                      </span>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </section>

      </div>
    </div>
  );
}