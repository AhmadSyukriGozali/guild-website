import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(request) {
  try {
    const { passkey } = await request.json();

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        {
          valid: false,
          error: 'Passkey tidak boleh kosong.',
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('master_passkey_hash')
      .eq('id', 1)
      .single();

    if (error) {
      console.error(
        'Verify passkey database error:',
        error.message
      );

      return NextResponse.json(
        {
          valid: false,
          error: 'Gagal membaca pengaturan guild.',
        },
        {
          status: 500,
        }
      );
    }

    const valid =
      data?.master_passkey_hash === passkey.trim();

    // Jika valid, kirim juga user_id dari header Authorization (optional)
    // untuk update role di client
    return NextResponse.json(
      {
        valid,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'Verify passkey unexpected error:',
      error
    );

    return NextResponse.json(
      {
        valid: false,
        error: 'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    );
  }
}