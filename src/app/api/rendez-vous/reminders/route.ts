import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { RendezVousFormData } from '@/types/database';
import { sendRendezVousNotificationEmail } from '../route';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies pour les rappels de rendez-vous.'
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  if (!secret || secret !== process.env.REMINDER_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowMinutes = 60; // fenêtre de sécurité pour ne pas rater un rappel
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const nowIso = now.toISOString();
    const windowStartIso = windowStart.toISOString();

    const { data: rdvs, error: rdvError } = await supabaseAdmin
      .from('rendez_vous')
      .select('*')
      .eq('rappel_envoye', false)
      .not('rappel_date', 'is', null)
      .lte('rappel_date', nowIso)
      .gte('rappel_date', windowStartIso);

    if (rdvError) {
      console.error('Erreur lors de la récupération des RDV à rappeler:', rdvError);
      return NextResponse.json(
        { error: 'Impossible de récupérer les rendez-vous à rappeler.' },
        { status: 500 }
      );
    }

    if (!rdvs || rdvs.length === 0) {
      return NextResponse.json(
        { message: 'Aucun rappel à envoyer.', processed: 0, sent: 0, failed: 0 },
        { status: 200 }
      );
    }

    const rendezVousList = rdvs as any[];

    const visiteIds = Array.from(
      new Set(
        rendezVousList
          .map((rdv) => rdv.visite_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    );

    const commercialIds = Array.from(
      new Set(
        rendezVousList
          .map((rdv) => rdv.commercial_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    );

    let visitesById: Record<string, any> = {};
    let profilesById: Record<string, { email: string | null; nom: string | null; prenom: string | null }> = {};

    if (visiteIds.length > 0) {
      const { data: visites, error: visitesError } = await supabaseAdmin
        .from('visites')
        .select('*')
        .in('id', visiteIds);

      if (visitesError) {
        console.error('Erreur lors de la récupération des visites pour les rappels:', visitesError);
      } else if (visites) {
        visitesById = (visites as any[]).reduce((acc, visite) => {
          acc[visite.id] = visite;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    if (commercialIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, nom, prenom')
        .in('id', commercialIds);

      if (profilesError) {
        console.error('Erreur lors de la récupération des profils pour les rappels:', profilesError);
      } else if (profiles) {
        profilesById = (profiles as any[]).reduce(
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
          {} as Record<string, { email: string | null; nom: string | null; prenom: string | null }>
        );
      }
    }

    const sentIds: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const rdv of rendezVousList) {
      const form = buildFormDataFromRendezVousRow(rdv);
      const visite = rdv.visite_id ? visitesById[rdv.visite_id] ?? null : null;
      const profile = profilesById[rdv.commercial_id as string];

      const createdBy: any = {
        id: rdv.commercial_id,
        email: profile?.email ?? null,
        user_metadata: profile
          ? {
              prenom: profile.prenom,
              nom: profile.nom,
            }
          : {},
      };

      try {
        await sendRendezVousNotificationEmail({
          form,
          rendezVous: rdv,
          visite,
          createdBy,
          type: 'reminder',
        });
        sentIds.push(rdv.id as string);
      } catch (error: any) {
        console.error('Erreur lors de l\'envoi du rappel pour le RDV', rdv.id, error);
        failed.push({ id: rdv.id as string, error: error?.message || 'Erreur inconnue' });
      }
    }

    if (sentIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('rendez_vous')
        .update({ rappel_envoye: true })
        .in('id', sentIds);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de rappel_envoye:', updateError);
      }
    }

    return NextResponse.json(
      {
        message: 'Traitement des rappels terminé.',
        processed: rendezVousList.length,
        sent: sentIds.length,
        failed: failed.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur inattendue lors de l\'envoi des rappels de rendez-vous:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

function buildFormDataFromRendezVousRow(row: any): RendezVousFormData {
  const dateObj = row.date_rdv ? new Date(row.date_rdv) : null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const dateStr = dateObj && !Number.isNaN(dateObj.getTime())
    ? dateObj.toISOString().slice(0, 10)
    : '';

  const heureDebut = dateObj && !Number.isNaN(dateObj.getTime())
    ? `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`
    : '';

  const form: RendezVousFormData = {
    entreprise: row.entreprise || '',
    personne_contact: row.personne_contact || '',
    date_rdv: dateStr,
    heure_debut: heureDebut,
  };

  if (row.telephone) form.tel_contact = row.telephone;
  if (row.email) form.email_contact = row.email;
  if (row.objet) form.objet = row.objet;
  if (row.description) form.description = row.description;
  if (row.adresse) form.lieu = row.adresse;
  if (row.statut) form.statut_rdv = row.statut;
  if (row.priorite) form.priorite = row.priorite;
  if (row.visite_id) form.visite_id = row.visite_id;

  // On n'utilise pas rappel_avant pour le rappel automatique, on se base sur rappel_date en base
  form.rappel_avant = null;

  return form;
}
