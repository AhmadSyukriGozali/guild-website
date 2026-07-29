import { supabaseAdmin } from '@/lib/supabase-admin';

export async function createActivityLog({
  adminId,
  action,
  targetType = null,
  targetId = null,
  description = '',
}) {
  try {
    if (!action) {
      console.error('Activity Log: action wajib diisi.');
      return;
    }

    const payload = {
      action,
      target_type: targetType,
      target_id: targetId,
      description,
    };

    // hanya simpan admin_id jika ada
    if (adminId) {
      payload.admin_id = adminId;
    }

    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert(payload);

    if (error) {
      console.error('Activity Log Error:', error);
    }
  } catch (err) {
    console.error('Activity Log Exception:', err);
  }
}