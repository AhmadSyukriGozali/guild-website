import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createActivityLog } from '@/lib/activity-log';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User ID wajib dikirim.',
        },
        {
          status: 400,
        }
      );
    }

    // Ambil data member
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Member tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    // Update status
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'guest',
        status: 'guest',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    // Simpan Activity Log
    await createActivityLog({
      adminId: null,
      action: 'reject_member',
      targetType: 'profiles',
      targetId: userId,
      description: `Menolak pengajuan member ${profile.username || profile.email}`,
    });

    return NextResponse.json({
      ok: true,
      message: 'Pengajuan member berhasil ditolak.',
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal Server Error',
      },
      {
        status: 500,
      }
    );
  }
}