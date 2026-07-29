import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        email,
        avatar_url,
        role,
        status,
        provider,
        ign,
        is_banned,
        joined_at
      `)
      .order('joined_at', {
        ascending: false,
      });

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
      members: data || [],
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