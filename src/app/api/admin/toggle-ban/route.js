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

    // Ambil status ban saat ini
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_banned')
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          ok: false,
          error: profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    // Toggle ban
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_banned: !profile.is_banned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
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
      banned: !profile.is_banned,
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