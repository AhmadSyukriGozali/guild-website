import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    /*
     * Ambil access token yang dikirim dari Dashboard.
     */
    const authorization =
      request.headers.get('authorization');

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Unauthorized. Token login tidak dikirim.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Pisahkan token dari:
     *
     * Bearer ACCESS_TOKEN
     */
    const accessToken =
      authorization.replace(
        'Bearer ',
        ''
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Unauthorized. Token login kosong.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Buat Supabase client untuk API.
     *
     * Access token disertakan di global headers agar
     * semua query selanjutnya terautentikasi
     * dan RLS dapat membaca auth.uid() dengan benar.
     */
    const supabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        }
      );

    /*
     * Validasi token dan ambil user yang login.
     */
    const {
      data: {
        user,
      },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      console.error(
        'Apply member auth error:',
        authError?.message ||
          'User tidak ditemukan'
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            'Unauthorized. Token login tidak valid atau sudah kedaluwarsa.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Ambil profil akun yang sedang login.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(
        'id, role, status'
      )
      .eq(
        'id',
        user.id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        'Apply member profile error:',
        profileError.message
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            'Gagal membaca data profil: ' +
            profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Profil harus sudah dibuat ketika
     * proses login selesai.
     */
    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Profil akun belum ditemukan. Logout lalu login kembali.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Staff dan Guild Master tidak perlu
     * mengajukan Member.
     */
    if (
      profile.role ===
        'officer' ||
      profile.role ===
        'guild_master'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Akun Staff atau Guild Master tidak perlu mengajukan Member.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Member yang sudah disetujui
     * tidak boleh mengajukan ulang.
     */
    if (
      profile.role ===
        'member' &&
      [
        'approved',
        'active',
        'member',
      ].includes(
        profile.status
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Akun kamu sudah menjadi Member.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Cegah pengajuan ganda.
     */
    if (
      profile.status ===
      'pending'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Pengajuan Member kamu masih menunggu persetujuan Staff.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Ubah status akun:
     *
     * guest → pending
     *
     * Role tetap guest sampai Staff
     * menyetujui pengajuan.
     */
    const {
      data: updatedProfile,
      error: updateError,
    } = await supabase
      .from('profiles')
      .update({
        status:
          'pending',

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        user.id
      )
      .select(
        'id, role, status'
      )
      .single();

    if (updateError) {
      console.error(
        'Apply member update error:',
        updateError.message
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            'Gagal mengirim pengajuan Member: ' +
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Pengajuan berhasil.
     */
    return NextResponse.json(
      {
        ok: true,

        message:
          'Pengajuan Member berhasil dikirim. Menunggu persetujuan Staff.',

        profile:
          updatedProfile,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'Apply member unexpected error:',
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    );
  }
}