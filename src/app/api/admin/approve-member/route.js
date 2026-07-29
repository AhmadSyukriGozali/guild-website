import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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