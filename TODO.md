# TODO — Integrasi Supabase ✅

## ✅ Completed
- [x] Analisis project & rencana komprehensif
- [x] SQL migration file (`supabase/migrations/00001_init.sql`) — 6 tabel + RLS + trigger
- [x] SQL migration berhasil di-execute ke Supabase
- [x] `src/lib/supabase-server.js` — Server client untuk Server Components
- [x] `src/middleware.js` — Auth guard proteksi halaman
- [x] `src/app/auth/callback/route.js` — Auto-create/update profile setelah login
- [x] `src/app/dashboard/page.js` — Data real dari database + stats
- [x] `src/app/login/page.js` — Verifikasi passkey via database
- [x] `src/app/admin/page.js` — CRUD passkey, guild name, emergency lock ke database
- [x] `src/app/tracker/page.js` — Boss CRUD + attendance real-time ke database
- [x] `src/app/looting/page.js` — Loot history dari database
- [x] `src/app/roster/page.js` — Anggota & pending dari database
- [x] `src/components/Sidebar.js` — Auto-fetch profile dari session
- [x] `.env.local` — Valid credentials Supabase

## ⏳ Test
- [ ] `npm run dev` — Test build & run
- [ ] Test login flow
- [ ] Test semua halaman

## 🔧 Fix Login Google (26 Jul 2025)
- [x] `src/lib/supabase.js` — Hapus `flowType: 'implicit'`, biarkan PKCE default (kompatibel Google & Discord)
- [x] `src/app/auth/callback/page.js` — Ganti delay 1 detik + getSession() dengan dual approach:
  - `getSession()` langsung untuk Discord (token dari URL hash)
  - `onAuthStateChange` listener untuk Google (PKCE exchange)
  - Timeout 15 detik sebagai fallback safety
- [ ] ⚠️ **WAJIB**: Aktifkan Google provider di Supabase Dashboard → Authentication → Providers → Google → masukkan Client ID & Client Secret dari Google Cloud Console

