import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import type { RendezVousFormData } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * GET /api/rendez-vous
 * Récupère la liste des rendez-vous
 */
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

    const { searchParams } = new URL(request.url);
    const visiteId = searchParams.get('visite_id');
    const statutRdv = searchParams.get('statut');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Client Supabase authentifié pour appliquer les policies RLS
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
      .from('rendez_vous')
      .select('*')
      .order('date_rdv', { ascending: true });

    // Filtrer par visite si spécifié
    if (visiteId) {
      query = query.eq('visite_id', visiteId);
    }

    // Filtrer par statut
    if (statutRdv) {
      query = query.eq('statut', statutRdv);
    }

    // Filtrer par plage de dates
    if (from) {
      query = query.gte('date_rdv', from);
    }

    if (to) {
      query = query.lte('date_rdv', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des RDV:', error);
      return NextResponse.json(
        { error: 'Impossible de récupérer les rendez-vous.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rendez-vous
 * Crée un nouveau rendez-vous
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { data?: RendezVousFormData }
      | null;

    if (!body?.data) {
      return NextResponse.json(
        { error: 'Données de rendez-vous requises.' },
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

    // Validation
    if (!form.entreprise || !form.date_rdv || !form.heure_debut) {
      return NextResponse.json(
        { error: 'Entreprise, date et heure de début sont obligatoires.' },
        { status: 400 }
      );
    }

    // Client Supabase authentifié
    const supabaseDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Déterminer le commercial_id
    // Si une visite_id est fournie, utiliser le commercial_id de la visite
    // Sinon, utiliser l'utilisateur connecté
    let commercialId = userData.user.id;

    if (form.visite_id) {
      const { data: visiteData, error: visiteError } = await supabaseDb
        .from('visites')
        .select('commercial_id')
        .eq('id', form.visite_id)
        .single();

      if (!visiteError && visiteData?.commercial_id) {
        commercialId = visiteData.commercial_id;
      }
    }

    // Combiner date et heure pour créer un timestamp
    const dateRdvTimestamp = `${form.date_rdv}T${form.heure_debut}:00`;

    // Préparer les données pour l'insertion
    const insertPayload = {
      commercial_id: commercialId,
      entreprise: form.entreprise,
      personne_contact: form.personne_contact || null,
      telephone: form.tel_contact || null,
      email: form.email_contact || null,
      ville: null,
      zone: null,
      adresse: form.lieu || null,
      date_rdv: dateRdvTimestamp,
      duree_estimee: form.heure_fin
        ? calculateDuration(form.heure_debut, form.heure_fin)
        : 60,
      objet: form.objet || null,
      description: form.description || null,
      statut: form.statut_rdv || 'planifie',
      priorite: form.priorite || 'normale',
      rappel_envoye: false,
      // Rappel forcé 24h (1440 minutes) avant le rendez-vous, indépendamment du champ rappel_avant
      rappel_date: calculateRappelDate(dateRdvTimestamp, 24 * 60),
      compte_rendu: null,
      visite_id: form.visite_id || null,
    };

    const { data: rdvData, error } = await supabaseDb
      .from('rendez_vous')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du RDV:', error);
      return NextResponse.json(
        { error: 'Impossible de créer le rendez-vous.' },
        { status: 500 }
      );
    }

    let visiteDetails: any | null = null;

    if (rdvData?.visite_id) {
      const { data: visiteData } = await supabaseDb
        .from('visites')
        .select('*')
        .eq('id', rdvData.visite_id)
        .single();

      visiteDetails = visiteData || null;
    }

    try {
      await sendRendezVousNotificationEmail({
        form,
        rendezVous: rdvData,
        visite: visiteDetails,
        createdBy: userData.user,
        type: 'creation',
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de notification de RDV:", emailError);
    }

    return NextResponse.json(
      { message: 'Rendez-vous créé avec succès.', data: rdvData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur inattendue lors de la création du RDV:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// Helper: Calculer la durée en minutes
function calculateDuration(heureDebut: string, heureFin: string): number {
  const [hd, md] = heureDebut.split(':').map(Number);
  const [hf, mf] = heureFin.split(':').map(Number);
  const debut = hd * 60 + md;
  const fin = hf * 60 + mf;
  return fin - debut;
}

// Helper: Calculer la date de rappel
function calculateRappelDate(dateRdv: string, minutesAvant: number): string {
  const date = new Date(dateRdv);
  date.setMinutes(date.getMinutes() - minutesAvant);
  return date.toISOString();
}

type RendezVousEmailPayload = {
  form: RendezVousFormData;
  rendezVous: any;
  visite: any | null;
  createdBy: any;
  type?: 'creation' | 'reminder';
};

type RendezVousEmailTemplateParams = {
  form: RendezVousFormData;
  visite: any | null;
  createdBy: any;
  mode?: 'creation' | 'reminder';
};

export async function sendRendezVousNotificationEmail(payload: RendezVousEmailPayload) {
  if (!process.env.SMTP_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Configuration SMTP incomplète. Email non envoyé.');
    return;
  }

  const { form, visite, createdBy, type = 'creation' } = payload;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls:
      process.env.SMTP_IGNORE_TLS_ERRORS === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_USER;
  const toAddress = 'k.oussema@rfidtunisie.com';

  const subjectEntreprise = form.entreprise || (visite && visite.entreprise) || '';
  const subjectDate = form.date_rdv || '';
  const subjectHeure = form.heure_debut || '';
  const subjectPrefix =
    type === 'reminder' ? 'Rappel de rendez-vous' : 'Nouveau rendez-vous planifié';
  const subject = `${subjectPrefix} - ${subjectEntreprise} - ${subjectDate} ${subjectHeure}`;

  const html = buildRendezVousEmailHtml({
    form,
    visite,
    createdBy,
    mode: type,
  });

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    subject,
    html,
  });
}

export function buildRendezVousEmailHtml(
  params: RendezVousEmailTemplateParams
): string {
  const { form, visite, createdBy, mode } = params;

  const meta = (createdBy?.user_metadata || {}) as {
    nom?: string | null;
    prenom?: string | null;
  };

  const commercialName = `${meta.prenom ?? ''} ${meta.nom ?? ''}`.trim() || createdBy?.email || '';

  const entreprise = form.entreprise || (visite && visite.entreprise) || '';
  const dateRdv = form.date_rdv || '';
  const heureDebut = form.heure_debut || '';
  const heureFin = (form as any).heure_fin || '';
  const lieu = (form as any).lieu || '';
  const objet = form.objet || '';
  const description = form.description || '';
  const statut = (form as any).statut_rdv || 'planifié';
  const priorite = (form as any).priorite || 'normale';

  const visiteDate = visite?.date_visite || '';
  const visitePersonne = visite?.personne_rencontree || '';
  const visiteVille = visite?.ville || '';
  const visiteZone = visite?.zone || '';
  const visiteAdresse = visite?.adresse || '';
  const visiteTel = visite?.tel_fixe || visite?.mobile || '';
  const visiteEmail = visite?.email || '';

  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const isReminder = mode === 'reminder';

  let visiteSection = '';

  if (visite) {
    const villeZone = [visiteVille, visiteZone].filter(Boolean).join(' - ');

    visiteSection = `
              <td style="vertical-align:top;padding:12px 0 12px 12px;border-left:1px solid #e5e7eb;">
                <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:8px;">Détails de la visite liée</div>
                <table cellspacing="0" cellpadding="0" style="font-size:13px;color:#374151;line-height:1.6;">
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Date visite</td>
                    <td style="padding:2px 0;">${visiteDate || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Interlocuteur</td>
                    <td style="padding:2px 0;">${visitePersonne || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Ville / Zone</td>
                    <td style="padding:2px 0;">${villeZone || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Adresse</td>
                    <td style="padding:2px 0;">${visiteAdresse || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Contact</td>
                    <td style="padding:2px 0;">${visiteTel || '-'}${visiteEmail ? '  ' + visiteEmail : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Objet de la visite</td>
                    <td style="padding:2px 0;">${visite.objet_visite || '-'}</td>
                  </tr>
                </table>
              </td>
    `;
  }

  const descriptionHtml = description ? description.replace(/\n/g, '<br />') : '';

  const descriptionSection = descriptionHtml
    ? `
      <tr>
        <td style="padding:0 24px 16px 24px;">
          <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:6px;">Notes complémentaires</div>
          <div style="font-size:13px;color:#4b5563;line-height:1.6;background-color:#f9fafb;border-radius:8px;padding:10px 12px;border:1px solid #e5e7eb;">
            ${descriptionHtml}
          </div>
        </td>
      </tr>
    `
    : '';

  return `
  <div style="font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#f4f5fb;padding:24px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:20px 24px;color:#e5e7eb;">
          <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">SalesTracker CRM</div>
          <div style="margin-top:4px;font-size:20px;font-weight:600;color:#f9fafb;">
            ${isReminder ? 'Rappel de rendez-vous' : 'Nouveau rendez-vous planifié'}
          </div>
          <div style="margin-top:4px;font-size:13px;opacity:0.85;">
            Créé par ${commercialName || 'Commercial non renseigné'}  ${now}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 12px 24px;">
          <div style="font-size:15px;color:#111827;margin-bottom:12px;">
            Bonjour,
          </div>
          <div style="font-size:14px;color:#4b5563;line-height:1.6;">
            ${
              isReminder
                ? 'Ceci est un rappel pour le rendez-vous suivant enregistré dans le CRM :'
                : "Un nouveau rendez-vous vient d'être enregistré dans le CRM pour le compte suivant :"
            }
            <span style="font-weight:600;color:#111827;">${entreprise || 'Entreprise non renseignée'}</span>.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 24px 16px 24px;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;padding:12px 12px 12px 0;">
                <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:8px;">Détails du rendez-vous</div>
                <table cellspacing="0" cellpadding="0" style="font-size:13px;color:#374151;line-height:1.6;">
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Entreprise</td>
                    <td style="padding:2px 0;font-weight:500;">${entreprise || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Contact</td>
                    <td style="padding:2px 0;">${(form as any).personne_contact || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Téléphone</td>
                    <td style="padding:2px 0;">${(form as any).tel_contact || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Email</td>
                    <td style="padding:2px 0;">${(form as any).email_contact || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Date</td>
                    <td style="padding:2px 0;">${dateRdv || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Heure</td>
                    <td style="padding:2px 0;">${heureDebut || '-'}${heureFin ? '  ' + heureFin : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Lieu</td>
                    <td style="padding:2px 0;">${lieu || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Objet</td>
                    <td style="padding:2px 0;">${objet || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Priorité</td>
                    <td style="padding:2px 0;">
                      <span style="display:inline-block;padding:2px 8px;border-radius:999px;background-color:#eff6ff;color:#1d4ed8;font-weight:500;">
                        ${priorite}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:2px 8px 2px 0;color:#6b7280;">Statut</td>
                    <td style="padding:2px 0;">${statut}</td>
                  </tr>
                </table>
              </td>
              ${visiteSection}
            </tr>
          </table>
        </td>
      </tr>
      ${descriptionSection}
      <tr>
        <td style="padding:8px 24px 20px 24px;">
          <div style="font-size:11px;color:#9ca3af;line-height:1.5;">
            Cet email a été généré automatiquement par SalesTracker. Merci de ne pas y répondre directement.
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;
}
