import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Profile, EquipeMember } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

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

    // Client authentifié pour appliquer correctement les policies RLS
    const supabaseDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: profilesData, error: profilesError } = await supabaseDb
      .from('profiles')
      .select('id, email, nom, prenom, role, telephone')
      .order('nom', { ascending: true });

    if (profilesError) {
      console.error("Erreur lors de la récupération de l'équipe:", profilesError);
      return NextResponse.json(
        { error: "Impossible de récupérer les membres de l'équipe." },
        { status: 500 }
      );
    }

    const { data: visitesData, error: visitesError } = await supabaseDb
      .from('visites')
      .select('id, commercial_id');

    if (visitesError) {
      console.error('Erreur lors de la récupération des visites pour le calcul équipe:', visitesError);
      return NextResponse.json(
        { error: "Impossible de récupérer les visites pour l'équipe." },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {};
    for (const visite of visitesData ?? []) {
      const commercialId = (visite as { commercial_id?: string }).commercial_id;
      if (!commercialId) continue;
      counts[commercialId] = (counts[commercialId] ?? 0) + 1;
    }

    const profiles = (profilesData ?? []) as Profile[];
    const equipe: EquipeMember[] = profiles.map((profile) => ({
      ...profile,
      total_visites: counts[profile.id] ?? 0,
    }));

    return NextResponse.json({ data: equipe }, { status: 200 });
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de l'équipe:", error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
