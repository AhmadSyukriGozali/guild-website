import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { passkey } = await request.json();

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Passkey tidak boleh kosong' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {}
            });
          },
        },
      }
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json(
        { valid: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = userData.user;

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('master_passkey_hash')
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { valid: false, error: error.message },
        { status: 500 }
      );
    }

    const storedPasskey = (data?.master_passkey_hash || '').trim();
    const inputPasskey = passkey.trim();

    if (!storedPasskey) {
      return NextResponse.json(
        { valid: false, error: 'Master passkey belum diisi di database' },
        { status: 500 }
      );
    }

    const isValid = storedPasskey === inputPasskey;

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Master Passkey Pengurus salah!' },
        { status: 200 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'officer',
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { valid: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ valid: true, role: 'officer' });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}