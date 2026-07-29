import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const [
      members,
      pending,
      officers,
      guildMasters,
      bosses,
      kills,
      loots,
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'officer'),

      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'guild_master'),

      supabaseAdmin
        .from('bosses')
        .select('*', { count: 'exact', head: true }),

      supabaseAdmin
        .from('boss_tracker')
        .select('*', { count: 'exact', head: true }),

      supabaseAdmin
        .from('loot_history')
        .select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        members: members.count || 0,
        pending: pending.count || 0,
        officers: officers.count || 0,
        guildMasters: guildMasters.count || 0,
        bosses: bosses.count || 0,
        kills: kills.count || 0,
        loots: loots.count || 0,
      },
    });
  } catch (error) {
    console.error(error);

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