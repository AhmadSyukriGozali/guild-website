import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Pada Route Handler, cookie bisa gagal diubah.
              // Sesi tetap dapat dibaca dari cookie yang sudah ada.
            }
          },
        },
      }
    );

    // Ambil user yang benar-benar sedang login.
    // getUser() memvalidasi user melalui Supabase Auth.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        'Apply member auth error:',
        authError?.message || 'User tidak ditemukan'
      );

      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized. Sesi login tidak ditemukan. Silakan login kembali.',
        },
        {
          status: 401,
        }
      );
    }

    // Ambil profil akun yang sedang login.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Apply member profile error:', profileError.message);

      return NextResponse.json(
        {
          ok: false,
          error: 'Gagal membaca data profil.',
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Profil akun belum ditemukan. Logout lalu login kembali agar profil dibuat.',
        },
        {
          status: 404,
        }
      );
    }

    // Staff dan Guild Master tidak perlu mengajukan member.
    if (
      profile.role === 'officer' ||
      profile.role === 'guild_master'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Akun Staff atau Guild Master tidak perlu mengajukan Member.',
        },
        {
          status: 400,
        }
      );
    }

    // Jika sudah menjadi Member, jangan ajukan ulang.
    if (
      profile.role === 'member' &&
      profile.status === 'approved'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Akun kamu sudah menjadi Member.',
        },
        {
          status: 400,
        }
      );
    }

    // Jika sudah pending, jangan membuat pengajuan ganda.
    if (profile.status === 'pending') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Pengajuan Member kamu masih menunggu persetujuan Staff.',
        },
        {
          status: 400,
        }
      );
    }

    // Ubah status Guest menjadi Pending.
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, role, status')
      .single();

    if (updateError) {
      console.error('Apply member update error:', updateError.message);

      return NextResponse.json(
        {
          ok: false,
          error: `Gagal mengirim pengajuan Member: ${updateError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          'Pengajuan Member berhasil dikirim. Menunggu persetujuan Staff.',
        profile: updatedProfile,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Apply member unexpected error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    );
  }
}