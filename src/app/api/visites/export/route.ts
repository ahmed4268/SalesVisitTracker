import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const token = request.cookies.get('sb-access-token')?.value;

    if (!token) {
      console.error('[Export] Token non trouvé dans les cookies');
      return NextResponse.json(
        { error: 'Non authentifié - Token manquant' },
        { status: 401 }
      );
    }

    // Créer un client Supabase standard (pas avec service key pour l'auth)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Vérifier l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('[Export] Erreur auth:', authError);
      return NextResponse.json(
        { error: `Erreur d'authentification: ${authError.message}` },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[Export] User null après getUser');
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
    }

    console.log('[Export] User authentifié:', user.id);

    // Récupérer le profil de l'utilisateur pour vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le rôle et construire la requête en conséquence
    const { searchParams } = new URL(request.url);
    const consultantFilter = searchParams.get('consultant_id');

    let query = supabase
      .from('visites')
      .select(`
        *,
        commercial:profiles!visites_commercial_id_fkey(prenom, nom)
      `);

    if (profile.role === 'commercial') {
      // Commercial : uniquement ses visites
      query = query.eq('commercial_id', user.id);
    } else if (profile.role === 'consultant') {
      // Consultant : ses visites créées
      if (consultantFilter && consultantFilter !== 'all') {
        query = query.eq('created_by', consultantFilter);
      } else if (!consultantFilter || consultantFilter !== 'all') {
        query = query.eq('created_by', user.id);
      }
      // Si 'all', pas de filtre
    } else if (profile.role === 'admin') {
      // Admin : peut filtrer par commercial ou tout voir
      if (consultantFilter && consultantFilter !== 'all') {
        query = query.eq('commercial_id', consultantFilter);
      }
      // Si 'all' ou pas de filtre, tout exporter
    } else {
      return NextResponse.json(
        { error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    const { data: visites, error: visitesError } = await query.order('date_visite', { ascending: false });

    if (visitesError) {
      console.error('Erreur lors de la récupération des visites:', visitesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des visites' },
        { status: 500 }
      );
    }

    if (!visites || visites.length === 0) {
      return NextResponse.json(
        { error: 'Aucune visite à exporter' },
        { status: 404 }
      );
    }

    // Créer le workbook et la feuille avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Visites');

    // Définir les colonnes avec largeurs
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Entreprise', key: 'entreprise', width: 35 },
      { header: 'Personne Rencontrée', key: 'personne', width: 22 },
      { header: 'Fonction/Poste', key: 'fonction', width: 28 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Téléphone', key: 'telephone', width: 15 },
      { header: 'Adresse', key: 'adresse', width: 35 },
      { header: 'Ville', key: 'ville', width: 18 },
      { header: 'Zone', key: 'zone', width: 18 },
      { header: 'Objet de la Visite', key: 'objet', width: 40 },
      { header: 'Commentaire', key: 'commentaire', width: 45 },
      { header: 'Statut Visite', key: 'statut_visite', width: 14 },
      { header: 'Statut Action', key: 'statut_action', width: 14 },
      { header: 'Montant (DT)', key: 'montant', width: 12 },
      { header: 'Probabilité (%)', key: 'probabilite', width: 12 },
      { header: 'Commercial', key: 'commercial', width: 22 },
      { header: 'Créé le', key: 'created', width: 12 },
    ];

    // Styler la ligne d'en-tête
    worksheet.getRow(1).font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E5090' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Ajouter les données
    visites.forEach((visite, index) => {
      const row = worksheet.addRow({
        date: visite.date_visite ? new Date(visite.date_visite).toLocaleDateString('fr-FR') : '',
        entreprise: visite.entreprise || '',
        personne: visite.personne_rencontree || '',
        fonction: visite.fonction_poste || '',
        email: visite.email || '',
        telephone: visite.telephone || '',
        adresse: visite.adresse || '',
        ville: visite.ville || '',
        zone: visite.zone || '',
        objet: visite.objet_visite || '',
        commentaire: visite.commentaire || '',
        statut_visite: visite.statut_visite === 'a_faire' ? 'À faire' : 
                       visite.statut_visite === 'en_cours' ? 'En cours' : 'Terminée',
        statut_action: visite.statut_action === 'en_attente' ? 'En attente' : 
                       visite.statut_action === 'accepte' ? 'Acceptée' : 'Refusée',
        montant: visite.montant || '',
        probabilite: visite.probabilite || '',
        commercial: visite.commercial 
          ? `${visite.commercial.prenom || ''} ${visite.commercial.nom || ''}`.trim() 
          : '',
        created: visite.created_at ? new Date(visite.created_at).toLocaleDateString('fr-FR') : '',
      });

      // Styler les lignes de données
      row.font = { size: 10, name: 'Calibri' };
      row.alignment = { vertical: 'top', wrapText: false };
      
      // Ajuster la hauteur pour un texte plus lisible
      const maxLength = Math.max(
        (visite.entreprise || '').length,
        (visite.fonction_poste || '').length,
        (visite.email || '').length,
        (visite.objet_visite || '').length,
        (visite.commentaire || '').length
      );
      
      // Hauteur dynamique basée sur la longueur du contenu
      if (maxLength > 100) {
        row.height = 35;
      } else if (maxLength > 60) {
        row.height = 25;
      } else {
        row.height = 20;
      }

      // Alignement spécifique pour les colonnes avec texte long
      ['entreprise', 'fonction', 'email', 'objet', 'commentaire', 'adresse'].forEach((key, idx) => {
        const columnIndex = [2, 4, 5, 10, 11, 7][idx]; // Indices des colonnes
        const cell = row.getCell(columnIndex);
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: false };
      });

      // Alterner les couleurs de fond
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }

      // Ajouter des bordures à chaque cellule
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
      });
    });

    // Ajouter des bordures aux en-têtes
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF2E5090' } },
        left: { style: 'thin', color: { argb: 'FF2E5090' } },
        bottom: { style: 'medium', color: { argb: 'FF2E5090' } },
        right: { style: 'thin', color: { argb: 'FF2E5090' } },
      };
    });

    // Activer les filtres automatiques
    worksheet.autoFilter = {
      from: 'A1',
      to: `Q1`,
    };

    // Figer la première ligne
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    // Générer le buffer Excel
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Créer le nom du fichier avec la date
    const now = new Date();
    const fileName = `visites_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

    // Retourner le fichier Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export Excel' },
      { status: 500 }
    );
  }
}
