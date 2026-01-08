import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { VisiteFormData } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { data?: VisiteFormData }
      | null;

    if (!body?.data) {
      return NextResponse.json(
        { error: 'Aucune donnée de visite fournie.' },
        { status: 400 }
      );
    }

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

    const form = body.data;

    // Client Supabase authentifié pour respecter les policies RLS (auth.uid, role authenticated)
    const supabaseDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Préparation des données pour la table "visites"
    const insertPayload = {
      commercial_id: userData.user.id,
      entreprise: form.entreprise,
      personne_rencontree: form.personne_rencontree,
      fonction_poste: form.fonction_poste || null,
      ville: form.ville || null,
      adresse: form.adresse || null,
      tel_fixe: form.tel_fixe || null,
      mobile: form.mobile || null,
      email: form.email || null,
      date_visite: form.date_visite,
      objet_visite: form.objet_visite,
      provenance_contact: form.provenance_contact || null,
      interet_client: form.interet_client || null,
      actions_a_entreprendre: form.actions_a_entreprendre || null,
      montant:
        typeof form.montant === 'number' && !Number.isNaN(form.montant)
          ? form.montant
          : null,
      date_prochaine_action: form.date_prochaine_action || null,
      remarques: form.remarques || null,
      probabilite:
        typeof form.probabilite === 'number' && !Number.isNaN(form.probabilite)
          ? form.probabilite
          : null,
      statut_visite: form.statut_visite,
      statut_action: form.statut_action ?? 'en_attente',
    };

    const { data, error } = await supabaseDb
      .from('visites')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la création de la visite:', error);
      return NextResponse.json(
        { error: "Impossible d'enregistrer la visite." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error('Erreur inattendue lors de la création de la visite:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

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

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '20', 10) || 20, 1),
      100
    );

    const statutVisite = searchParams.get('statut_visite');
    const statutAction = searchParams.get('statut_action');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const commercialIdFilter = searchParams.get('commercial_id');

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Client Supabase authentifié pour appliquer les policies RLS avec le bon utilisateur
    const supabaseDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Récupérer le profil utilisateur pour connaître son rôle
    const { data: userProfile } = await supabaseDb
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    const userRole = userProfile?.role;

    let query = supabaseDb
      .from('visites')
      .select('*', { count: 'exact' })
      .order('date_visite', { ascending: false });

    // Filtrer par commercial si admin/consultant et si un commercial est spécifié
    if (commercialIdFilter && (userRole === 'admin' || userRole === 'consultant')) {
      query = query.eq('commercial_id', commercialIdFilter);
    }

    if (statutVisite) {
      query = query.eq('statut_visite', statutVisite);
    }

    if (statutAction) {
      query = query.eq('statut_action', statutAction);
    }

    if (fromDate) {
      query = query.gte('date_visite', fromDate);
    }

    if (toDate) {
      query = query.lte('date_visite', toDate);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `entreprise.ilike.${term},personne_rencontree.ilike.${term}`
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Erreur lors de la récupération des visites:', error);
      return NextResponse.json(
        { error: 'Impossible de récupérer les visites.' },
        { status: 500 }
      );
    }

    const visitesData = (data ?? []) as any[];

    // Nom complet du commercial connecté (utilisé pour annoter les visites)
    const userMeta = (userData.user.user_metadata || {}) as {
      nom?: string | null;
      prenom?: string | null;
    };
    const fullNameFromMeta = `${userMeta.prenom ?? ''} ${userMeta.nom ?? ''}`
      .trim() || userData.user.email || null;

    const commercialIds = Array.from(
      new Set(
        visitesData
          .map((v) => (v as { commercial_id?: string | null }).commercial_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let profilesById: Record<
      string,
      { email: string | null; nom: string | null; prenom: string | null }
    > = {};

    if (commercialIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseDb
        .from('profiles')
        .select('id, email, nom, prenom')
        .in('id', commercialIds);

      if (profilesError) {
        console.error(
          'Erreur lors de la récupération des profils pour les visites:',
          profilesError
        );
      } else if (profilesData) {
        profilesById = (profilesData as any[]).reduce(
          (
            acc,
            profile: { id: string; email: string | null; nom: string | null; prenom: string | null }
          ) => {
            acc[profile.id] = {
              email: profile.email,
              nom: profile.nom,
              prenom: profile.prenom,
            };
            return acc;
          },
          {} as Record<
            string,
            { email: string | null; nom: string | null; prenom: string | null }
          >
        );
      }
    }

    const visitesWithUser = visitesData.map((v) => {
      const commercialId = (v as { commercial_id?: string | null }).commercial_id;
      let commercialName: string | null = null;

      if (commercialId) {
        if (commercialId === userData.user.id) {
          commercialName = fullNameFromMeta;
        } else {
          const profile = profilesById[commercialId];
          if (profile) {
            const fullName = `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim();
            commercialName = fullName || profile.email || null;
          }
        }
      }

      const visite = {
        ...v,
        commercial_name: commercialName,
      };

      // Sécurité: Masquer les données sensibles côté serveur
      // Les commerciaux ne voient les montants et probabilités que de leurs propres visites
      const canViewSensitive =
        userRole === 'admin' ||
        userRole === 'consultant' ||
        commercialId === userData.user.id;

      if (!canViewSensitive) {
        // Supprimer complètement les champs sensibles (pas juste les masquer)
        visite.montant = null;
        visite.probabilite = null;
      }

      return visite;
    });

    return NextResponse.json(
      {
        data: visitesWithUser,
        pagination: {
          page,
          pageSize,
          total: count ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des visites:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
