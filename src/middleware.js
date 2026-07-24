/**
 * Middleware — Proteksi halaman yang butuh authentication.
 * Redirect ke /login jika user belum login.
 * 
 * NOTE: Next.js 16 mendeprekasi "middleware" → beralih ke "proxy".
 * Untuk sekarang gunakan penanganan manual di client-side agar kompatibel.
 * 
 * Pendekatan: Gunakan middleware minimal hanya untuk matcher,
 * dan biarkan client-side yang handle redirect.
 */
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke halaman login, auth callback, dan assets statis
  if (
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};


