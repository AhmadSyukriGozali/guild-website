import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const body = await request.json();

    // Field yang boleh diubah
    const allowedFields = [
      'guild_name',
      'master_passkey_hash',
      'emergency_lock',
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tidak ada data yang akan diperbarui.',
        },
        {
          status: 400,
        }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('app_settings')
      .update(updateData)
      .eq('id', 1);

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
      message: 'Pengaturan berhasil diperbarui.',
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