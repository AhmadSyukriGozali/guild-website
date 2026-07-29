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
        joined_at,
        updated_at
      `)
      .eq('status', 'pending')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get Pending Members:', error);

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