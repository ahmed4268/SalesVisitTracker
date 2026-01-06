import { NextResponse } from 'next/server';

// Endpoint de déconnexion : supprime les cookies d'auth Supabase
export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Effacer les cookies d'authentification
  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
