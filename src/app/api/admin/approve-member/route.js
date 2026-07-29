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

    // Ambil data user terlebih dahulu
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

    // Update role
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'member',
        status: 'active',
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

    // Activity Log
    await createActivityLog({
      adminId: null,
      action: 'approve_member',
      targetType: 'profiles',
      targetId: userId,
      description: `Menyetujui member ${profile.username || profile.email}`,
    });

    return NextResponse.json({
      ok: true,
      message: 'Member berhasil disetujui.',
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