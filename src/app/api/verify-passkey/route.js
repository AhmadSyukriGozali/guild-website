import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Buat Supabase admin client (service_role bypass RLS)
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
      console.error(error);
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
    console.log("Input Passkey :", passkey);
    console.log("DB Passkey    :", data?.master_passkey_hash);
    
    const isValid = data?.master_passkey_hash === passkey;

    console.log("Match :", isValid);

    return NextResponse.json({ valid: isValid });
  } catch (err) {
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}

