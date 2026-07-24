import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Buat Supabase admin client (service_role bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

    if (!passkey) {
      return NextResponse.json({ valid: false, error: 'Passkey tidak boleh kosong' }, { status: 400 });
    }

    // Ambil passkey dari tabel app_settings (via public anon, tapi kita bypass)
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('master_passkey_hash')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Verify passkey - DB error:', error.message);
      // Fallback: coba via raw SQL
      try {
        const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('verify_master_passkey', {
          input_passkey: passkey,
        });

        if (sqlError) {
          return NextResponse.json({ valid: false, error: 'Fungsi verifikasi passkey belum tersedia di database' }, { status: 500 });
        }

        return NextResponse.json({ valid: sqlData === true });
      } catch {
        return NextResponse.json({ valid: false, error: 'Gagal terhubung ke database' }, { status: 500 });
      }
    }

    // Bandingkan passkey
    const isValid = data?.master_passkey_hash === passkey;

    return NextResponse.json({ valid: isValid });
  } catch (err) {
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}

