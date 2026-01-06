import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null as any);
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe sont requis.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || 'Identifiants incorrects.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { user: data.user },
      { status: 200 }
    );

    // Stocker les tokens dans des cookies httpOnly pour une utilisation ultérieure côté serveur
    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;

    if (accessToken) {
      response.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      });
    }

    if (refreshToken) {
      response.cookies.set('sb-refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 jours
      });
    }

    return response;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
