import { supabaseAdmin } from '@/lib/supabase-admin';

export async function createActivityLog({
  adminId,
  action,
  targetType = null,
  targetId = null,
  description,
}) {
  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        description,
      });

    if (error) {
      console.error('Activity Log:', error);
    }
  } catch (err) {
    console.error('Activity Log:', err);
  }
}