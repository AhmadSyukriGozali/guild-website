import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        id,
        action,
        description,
        created_at,
        profiles:admin_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(10);

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
      logs: data || [],
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