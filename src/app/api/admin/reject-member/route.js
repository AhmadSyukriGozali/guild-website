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

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'guest',
        status: 'guest',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    const { data: member } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    await createActivityLog({
      adminId: null,
      action: 'REJECT_MEMBER',
      targetType: 'profiles',
      targetId: userId,
      description: `Member ${member?.username} ditolak.`,
    });

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