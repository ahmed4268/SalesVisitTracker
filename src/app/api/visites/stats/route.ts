import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { StatsVisites } from '@/types/database';

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
    const searchParams = url.searchParams;

    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    let baseQuery = supabase
      .from('visites')
      .select(
        'id, statut_visite, statut_action, montant, probabilite',
        { count: 'exact' }
      )
      .eq('commercial_id', userData.user.id);

    if (fromDate) {
      baseQuery = baseQuery.gte('date_visite', fromDate);
    }

    if (toDate) {
      baseQuery = baseQuery.lte('date_visite', toDate);
    }

    const { data, error } = await baseQuery;

    if (error) {
      console.error('Erreur lors du calcul des statistiques de visites:', error);
      return NextResponse.json(
        { error: 'Impossible de calculer les statistiques.' },
        { status: 500 }
      );
    }

    const stats: StatsVisites = {
      total_visites: 0,
      visites_a_faire: 0,
      visites_en_cours: 0,
      visites_terminees: 0,
      visites_acceptees: 0,
      visites_refusees: 0,
      montant_total: 0,
      probabilite_moyenne: 0,
    };

    if (!data || data.length === 0) {
      return NextResponse.json(stats, { status: 200 });
    }

    let sommeProbabilite = 0;
    let nombreProbabilites = 0;

    for (const visite of data as any[]) {
      stats.total_visites += 1;

      if (visite.statut_visite === 'a_faire') stats.visites_a_faire += 1;
      if (visite.statut_visite === 'en_cours') stats.visites_en_cours += 1;
      if (visite.statut_visite === 'termine') stats.visites_terminees += 1;

      if (visite.statut_action === 'accepte') stats.visites_acceptees += 1;
      if (visite.statut_action === 'refuse') stats.visites_refusees += 1;

      if (typeof visite.montant === 'number') {
        stats.montant_total += visite.montant;
      }

      if (typeof visite.probabilite === 'number') {
        sommeProbabilite += visite.probabilite;
        nombreProbabilites += 1;
      }
    }

    stats.probabilite_moyenne =
      nombreProbabilites > 0 ? Number((sommeProbabilite / nombreProbabilites).toFixed(1)) : 0;

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Erreur inattendue lors du calcul des statistiques de visites:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
