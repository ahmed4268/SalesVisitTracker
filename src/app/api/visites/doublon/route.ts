import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { DoublonCheck } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: "Impossible de récupérer l'utilisateur courant." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const entreprise = url.searchParams.get('entreprise');

    if (!entreprise || !entreprise.trim()) {
      return NextResponse.json(
        { error: "Le paramètre 'entreprise' est requis." },
        { status: 400 }
      );
    }

    const term = entreprise.trim();

    const { data, error } = await supabase
      .from('visites')
      .select('id, entreprise, date_visite, created_at')
      .eq('commercial_id', userData.user.id)
      .ilike('entreprise', term)
      .order('date_visite', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erreur lors de la vérification de doublon de visite:', error);
      return NextResponse.json(
        { error: 'Impossible de vérifier les doublons.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      const empty: DoublonCheck = {
        existe: false,
        derniere_visite_id: null,
        derniere_date: null,
        commercial_nom: null,
        jours_depuis_visite: null,
      };
      return NextResponse.json(empty, { status: 200 });
    }

    const last = data[0] as any;

    const derniereDate = last.date_visite || last.created_at;
    const jours_depuis_visite = derniereDate
      ? Math.floor(
          (Date.now() - new Date(derniereDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    const result: DoublonCheck = {
      existe: true,
      derniere_visite_id: last.id,
      derniere_date: derniereDate,
      commercial_nom: `${userData.user.user_metadata?.nom ?? ''} ${
        userData.user.user_metadata?.prenom ?? ''
      }`.trim() || null,
      jours_depuis_visite,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erreur inattendue lors de la vérification de doublon de visite:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
