import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createActivityLog } from '@/lib/activity-log';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      role,
      status,
    } = body;

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

    if (!role) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Role wajib dikirim.',
        },
        {
          status: 400,
        }
      );
    }

    // Ambil data member lama
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, role, status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Member tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    // Update role
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        status,
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

    // Activity Log
    await createActivityLog({
      adminId: null,
      action: 'update_member',
      targetType: 'profiles',
      targetId: userId,
      description:
        `${profile.username || profile.email} : ` +
        `${profile.role} → ${role}`,
    });

    return NextResponse.json({
      ok: true,
      message: 'Role member berhasil diperbarui.',
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