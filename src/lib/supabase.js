import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL atau Anon Key belum tersedia. Periksa Environment Variables.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      /*
       * Gunakan implicit flow karena provider saat ini
       * mengembalikan access_token pada URL hash.
       */
      flowType: 'implicit',

      /*
       * Supabase akan membaca access_token dan refresh_token
       * dari URL secara otomatis.
       */
      detectSessionInUrl: true,

      /*
       * Session disimpan di browser.
       */
      persistSession: true,

      /*
       * Session diperbarui otomatis jika mendekati masa habis.
       */
      autoRefreshToken: true,
    },
  }
);