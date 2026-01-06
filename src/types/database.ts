export type Role = 'commercial' | 'superieur'
export type StatutVisite = 'a_faire' | 'en_cours' | 'termine'
export type StatutAction = 'en_attente' | 'accepte' | 'refuse'

export interface Profile {
  id: string
  email: string
  nom: string
  prenom: string
  role: Role
  telephone: string | null
  created_at: string
  updated_at: string
}

export interface Visite {
  id: string
  commercial_id: string
  commercial_name?: string
  
  // Client
  entreprise: string
  personne_rencontree: string
  fonction_poste: string | null
  ville: string | null
  adresse: string | null
  tel_fixe: string | null
  mobile: string | null
  email: string | null
  
  // Visite
  date_visite: string
  objet_visite: string
  provenance_contact: string | null
  interet_client: string | null
  actions_a_entreprendre: string | null
  montant: number | null
  date_prochaine_action: string | null
  remarques: string | null
  probabilite: number | null
  
  // Statuts
  statut_visite: StatutVisite
  statut_action: StatutAction
  
  // Système
  created_at: string
  updated_at: string
  
  // Relations
  commercial?: Profile
}

export interface VisiteFormData {
  entreprise: string
  personne_rencontree: string
  fonction_poste?: string
  ville?: string
  adresse?: string
  tel_fixe?: string
  mobile?: string
  email?: string
  date_visite: string
  objet_visite: string
  provenance_contact?: string
  interet_client?: string
  actions_a_entreprendre?: string
  montant?: number
  date_prochaine_action?: string
  remarques?: string
  probabilite?: number
  statut_visite: StatutVisite
  statut_action?: StatutAction
}

export interface DoublonCheck {
  existe: boolean
  derniere_visite_id: string | null
  derniere_date: string | null
  commercial_nom: string | null
  jours_depuis_visite: number | null
}

export interface StatsVisites {
  total_visites: number
  visites_a_faire: number
  visites_en_cours: number
  visites_terminees: number
  visites_acceptees: number
  visites_refusees: number
  montant_total: number
  probabilite_moyenne: number
}

export interface EquipeMember extends Profile {
  total_visites: number
}
