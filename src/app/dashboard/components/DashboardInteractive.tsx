'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../../../components/ui/AppIcon';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type { StatsVisites, Visite, EquipeMember, StatutVisite, StatutAction } from '@/types/database';

import KPICard from './KPICard';
import ActivityItem from './ActivityItem';
import UpcomingVisitCard from './UpcomingVisitCard';
import QuickActionButton from './QuickActionButton';
import PerformanceChart from './PerformanceChart';
import TeamMemberCard from './TeamMemberCard';
import FilterPanel from './FilterPanel';
import RdvListCard from './RdvListCard';

interface KPIData {
  title: string;
  value: string;
  change: number;
  icon: string;
  trend: 'up' | 'down';
  color: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  avatar: string;
  avatarAlt: string;
  type: 'visit' | 'client' | 'report';
}

interface UpcomingVisit {
  id: number;
  clientName: string;
  clientImage: string;
  clientImageAlt: string;
  time: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  avatarAlt: string;
  visitsToday: number;
  status: 'active' | 'away' | 'offline';
  mustChangePassword?: boolean;
}

interface ChartDataPoint {
  month: string;
  visits: number;
  conversions: number;
}

const DEFAULT_AVATAR_SRC = '/assets/images/user.png';
const DEFAULT_AVATAR_ALT = 'Photo de profil utilisateur';

export default function DashboardInteractive() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [resultMenuOpen, setResultMenuOpen] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsVisites | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [visites, setVisites] = useState<Visite[]>([]);
  const [visitesLoading, setVisitesLoading] = useState(false);
  const [visitesError, setVisitesError] = useState<string | null>(null);

  const [totalVisites, setTotalVisites] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutVisiteFilter, setStatutVisiteFilter] = useState<string>('');
  const [statutActionFilter, setStatutActionFilter] = useState<string>('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [commercialFilter, setCommercialFilter] = useState<string>('');
  const [villeFilter, setVilleFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [equipeLoading, setEquipeLoading] = useState(false);
  const [equipeError, setEquipeError] = useState<string | null>(null);
  const [teamMembersState, setTeamMembersState] = useState<TeamMember[] | null>(null);
  const [commercialList, setCommercialList] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'commercial' | 'admin' | 'consultant' | null>(null);
  
  // État pour la card des RDV
  const [rdvCardOpen, setRdvCardOpen] = useState<string | null>(null);
  const [selectedVisiteName, setSelectedVisiteName] = useState<string>('');
  const [selectedVisiteData, setSelectedVisiteData] = useState<Visite | null>(null);
  const [rdvCounts, setRdvCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('stpro_user');
      if (!raw) return;

      const stored = JSON.parse(raw) as {
        id?: string | null;
        role?: string | null;
      };

      if (stored.id) {
        setCurrentUserId(stored.id);
      }

      if (stored.role === 'admin') {
        setCurrentUserRole('admin');
      } else if (stored.role === 'commercial') {
        setCurrentUserRole('commercial');
      } else if (stored.role === 'consultant') {
        setCurrentUserRole('consultant');
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  const formatVisitDate = (dateStr: string): string => {
    if (!dateStr) return 'Date non définie';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const canManageVisite = (visite: Visite): boolean => {
    if (!currentUserId) return false;
    // Seuls l'admin et le propriétaire peuvent modifier/supprimer
    if (currentUserRole === 'admin') return true;
    return visite.commercial_id === currentUserId;
  };

  const canViewSensitive = (visite: Visite): boolean => {
    if (!currentUserId) return false;
    // Admin et consultant voient toujours tout
    // Commercial voit uniquement ses propres montants et probabilités
    if (currentUserRole === 'admin' || currentUserRole === 'consultant') {
      return true;
    }
    return visite.commercial_id === currentUserId;
  };

  // Handle status change
  const handleStatusChange = async (visiteId: string, newStatus: StatutVisite) => {
    try {
      const response = await fetch(`/api/visites/update?id=${visiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut_visite: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      // Refresh visits
      setVisites(prev => prev.map(v => 
        v.id === visiteId ? { ...v, statut_visite: newStatus } : v
      ));
      success('Statut mis à jour avec succès');
      setStatusMenuOpen(null);
    } catch (err) {
      error('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle result change
  const handleResultChange = async (visiteId: string, newResult: StatutAction) => {
    try {
      const response = await fetch(`/api/visites/update?id=${visiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut_action: newResult }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du résultat');
      }

      // Refresh visits
      setVisites(prev => prev.map(v => 
        v.id === visiteId ? { ...v, statut_action: newResult } : v
      ));
      success('Résultat mis à jour avec succès');
      setResultMenuOpen(null);
    } catch (err) {
      error('Erreur lors de la mise à jour du résultat');
    }
  };

  // Récupération des statistiques globales
  useEffect(() => {
    if (!isHydrated) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const statsResponse = await fetch('/api/visites/stats');
        if (statsResponse.ok) {
          const statsJson = (await statsResponse.json()) as StatsVisites;
          setStats(statsJson);
        } else {
          console.error('Erreur lors du chargement des statistiques de visites:', await statsResponse.text());
          setStatsError("Impossible de charger les statistiques de vos visites.");
        }
      } catch (error) {
        console.error('Erreur réseau lors du chargement des statistiques de visites:', error);
        setStatsError("Erreur réseau lors du chargement des statistiques.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isHydrated, selectedPeriod]);

  // Récupération des visites pour le tableau avec filtres & pagination
  useEffect(() => {
    if (!isHydrated) return;

    const fetchVisites = async () => {
      try {
        setVisitesLoading(true);
        setVisitesError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });

        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }
        if (statutVisiteFilter) {
          params.set('statut_visite', statutVisiteFilter);
        }
        if (statutActionFilter) {
          params.set('statut_action', statutActionFilter);
        }
        if (fromFilter) {
          params.set('from', fromFilter);
        }
        if (toFilter) {
          params.set('to', toFilter);
        }
        if (commercialFilter) {
          params.set('commercial_id', commercialFilter);
        }
        if (villeFilter.trim()) {
          params.set('ville', villeFilter.trim());
        }
        if (zoneFilter.trim()) {
          params.set('zone', zoneFilter.trim());
        }

        const visitesResponse = await fetch(`/api/visites?${params.toString()}`);
        if (!visitesResponse.ok) {
          console.error('Erreur lors du chargement des visites:', await visitesResponse.text());
          setVisitesError('Impossible de charger les visites.');
          return;
        }

        const json = await visitesResponse.json();
        const data = (json?.data ?? []) as Visite[];
        setVisites(data);
        setTotalVisites(json?.pagination?.total ?? null);

        // Charger le nombre de RDV pour chaque visite
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (visite) => {
            try {
              const rdvResponse = await fetch(`/api/rendez-vous?visite_id=${visite.id}`);
              if (rdvResponse.ok) {
                const rdvJson = await rdvResponse.json();
                counts[visite.id] = rdvJson.data?.length || 0;
              }
            } catch (err) {
              counts[visite.id] = 0;
            }
          })
        );
        setRdvCounts(counts);
      } catch (error) {
        console.error('Erreur réseau lors du chargement des visites:', error);
        setVisitesError('Erreur réseau lors du chargement des visites.');
      } finally {
        setVisitesLoading(false);
      }
    };

    fetchVisites();
  }, [
    isHydrated,
    page,
    pageSize,
    searchTerm,
    statutVisiteFilter,
    statutActionFilter,
    fromFilter,
    toFilter,
    commercialFilter,
    villeFilter,
    zoneFilter,
  ]);

  // Récupération de l'équipe réelle (tous les utilisateurs pour le filtre commercial)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const fetchEquipe = async () => {
      try {
        setEquipeLoading(true);
        setEquipeError(null);

        const equipeResponse = await fetch('/api/equipe');
        if (!equipeResponse.ok) {
          console.error('Erreur lors du chargement de l\'équipe:', await equipeResponse.text());
          setEquipeError('Impossible de charger les commerciaux.');
          return;
        }

        const json = await equipeResponse.json();
        const data = (json?.data ?? []) as EquipeMember[];
        
        // Transformer en format pour le dropdown
        const commercialOptions = data.map((member) => ({
          id: member.id,
          name: `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email,
        }));
        
        setCommercialList(commercialOptions);
        
        // Récupérer le compte total de visites pour chaque commercial
        const visitCountByCommercial: Record<string, number> = {};
        
        await Promise.all(
          data.map(async (member) => {
            try {
              const params = new URLSearchParams({
                commercial_id: member.id,
                pageSize: '1' // On veut juste le total, pas les données
              });
              const response = await fetch(`/api/visites?${params.toString()}`);
              if (response.ok) {
                const result = await response.json();
                visitCountByCommercial[member.id] = result?.pagination?.total ?? 0;
              }
            } catch (error) {
              console.error(`Erreur lors du comptage des visites pour ${member.id}:`, error);
              visitCountByCommercial[member.id] = 0;
            }
          })
        );
        
        setTeamMembersState(
          data.map((member) => ({
            id: member.id as unknown as number,
            name: `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email,
            role: member.role || 'commercial',
            avatar: DEFAULT_AVATAR_SRC,
            avatarAlt: DEFAULT_AVATAR_ALT,
            visitsToday: visitCountByCommercial[member.id] || 0,
            status: 'active' as const,
          }))
        );
      } catch (error) {
        console.error('Erreur réseau lors du chargement de l\'équipe:', error);
        setEquipeError('Erreur réseau lors du chargement de l\'équipe.');
      } finally {
        setEquipeLoading(false);
      }
    };

    fetchEquipe();
  }, [isHydrated, currentUserRole]);

  const recentActivities: Activity[] = [
    {
      id: 1,
      user: 'Sophie Martin',
      action: 'a complété une visite chez TechCorp Solutions',
      time: 'Il y a 5 minutes',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      type: 'visit'
    },
    {
      id: 2,
      user: 'Marc Dubois',
      action: 'a ajouté un nouveau client: Innovation Labs',
      time: 'Il y a 12 minutes',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      type: 'client'
    },
    
  ];

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Sophie Martin',
      role: 'Responsable Commercial',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      visitsToday: 8,
      status: 'active'
    },
    {
      id: 2,
      name: 'Marc Dubois',
      role: 'Représentant Senior',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      visitsToday: 6,
      status: 'active'
    },
    {
      id: 3,
      name: 'Julie Rousseau',
      role: 'Analyste Commercial',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      visitsToday: 4,
      status: 'away'
    },
    {
      id: 4,
      name: 'Thomas Bernard',
      role: 'Représentant',
      avatar: DEFAULT_AVATAR_SRC,
      avatarAlt: DEFAULT_AVATAR_ALT,
      visitsToday: 5,
      status: 'active'
    }
  ];

  const chartData: ChartDataPoint[] = [
    { month: 'Jan', visits: 145, conversions: 98 },
    { month: 'Fév', visits: 178, conversions: 121 },
    { month: 'Mar', visits: 203, conversions: 138 },
    { month: 'Avr', visits: 189, conversions: 129 },
    { month: 'Mai', visits: 221, conversions: 151 },
    { month: 'Juin', visits: 247, conversions: 169 }
  ];

  const quickActions = [
    { icon: 'PlusCircleIcon', label: 'Nouvelle Visite', color: 'from-primary to-secondary', route: '/visit-form' },
    { icon: 'UserPlusIcon', label: 'Ajouter Client', color: 'from-secondary to-accent', route: '/dashboard' },
    { icon: 'ChartBarIcon', label: 'Voir Rapports', color: 'from-accent to-primary', route: '/analytics-center' },
    { icon: 'CalendarIcon', label: 'Planifier', color: 'from-primary to-accent', route: '/dashboard' }
  ];

  const handleQuickAction = (route: string) => {
    router.push(route);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative">
        {/* Main Content */}
        <main className="pt-24 pb-12 px-4 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                    Tableau de Bord
                  </h1>
                  <p className="text-muted-foreground font-body">
                    Vue d'ensemble de vos performances commerciales
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-foreground font-cta focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                  >
                    <option value="week">Cette Semaine</option>
                    <option value="month">Ce Mois</option>
                    <option value="quarter">Ce Trimestre</option>
                    <option value="year">Cette Année</option>
                  </select>
                  <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-cta font-semibold hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300">
                    Exporter
                  </button>
                </div>
              </div>
            </div>

            {statsLoading && (
              <p className="mb-6 text-sm text-muted-foreground font-body">
                Chargement de vos statistiques de visites...
              </p>
            )}
            {statsError && !statsLoading && (
              <p className="mb-6 text-sm text-destructive font-body">
                {statsError}
              </p>
            )}

            {/* Main Dashboard Content */}
            <div className="space-y-8">
              {/* Tableau des visites - pleine largeur */}
              <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
                <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">
                      Toutes les visites
                    </h2>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {totalVisites !== null
                        ? `${totalVisites} visite${totalVisites > 1 ? 's' : ''} trouvée${
                            totalVisites > 1 ? 's' : ''
                          }`
                        : 'Liste de vos visites avec filtres dynamiques.'}
                    </p>
                  </div>

                  <div className="flex flex-col w-full gap-3 md:w-auto md:flex-row md:items-center">
                    <FilterPanel
                      onApply={(filters) => {
                        setPage(1);
                        setSearchTerm(filters.search);
                        setStatutVisiteFilter(filters.statutVisite);
                        setStatutActionFilter(filters.statutAction);
                        setFromFilter(filters.from);
                        setToFilter(filters.to);
                        setCommercialFilter(filters.commercial || '');
                        setVilleFilter(filters.ville || '');
                        setZoneFilter(filters.zone || '');
                      }}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      statutVisiteFilter={statutVisiteFilter}
                      onStatutVisiteChange={setStatutVisiteFilter}
                      statutActionFilter={statutActionFilter}
                      onStatutActionChange={setStatutActionFilter}
                      fromFilter={fromFilter}
                      onFromChange={setFromFilter}
                      toFilter={toFilter}
                      onToChange={setToFilter}
                      commercialFilter={commercialFilter}
                      onCommercialChange={setCommercialFilter}
                      commercials={commercialList}
                      isAdmin={currentUserRole === 'admin' || currentUserRole === 'consultant'}
                      villeFilter={villeFilter}
                      onVilleChange={setVilleFilter}
                      zoneFilter={zoneFilter}
                      onZoneChange={setZoneFilter}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-xs xl:text-sm">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <tr className="text-left text-[10px] xl:text-xs uppercase tracking-wider text-slate-600 font-semibold">
                        <th className="px-2 py-3 w-[90px]">Date</th>
                        <th className="px-2 py-3 min-w-[140px]">Entreprise</th>
                        <th className="px-2 py-3 min-w-[120px]">Contact</th>
                        <th className="px-2 py-3 w-[90px] hidden md:table-cell">Objet</th>
                        <th className="px-2 py-3 w-[90px] hidden lg:table-cell">Commercial</th>
                        <th className="px-2 py-3 w-[80px] hidden md:table-cell">Ville</th>
                        <th className="px-2 py-3 w-[70px] hidden xl:table-cell">Zone</th>
                        <th className="px-2 py-3 w-[95px]">Statut</th>
                        <th className="px-2 py-3 w-[140px]">
                          Résultat
                        </th>
                        <th className="px-2 py-3 w-[65px] hidden lg:table-cell">
                          Montant
                        </th>
                        <th className="px-2 py-3 w-[50px] hidden lg:table-cell">
                          Prob.
                        </th>
                        <th className="px-2 py-3 w-[120px] text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visitesLoading && (
                        <tr>
                          <td
                            colSpan={12}
                            className="px-4 py-6 text-center text-xs text-muted-foreground"
                          >
                            Chargement des visites...
                          </td>
                        </tr>
                      )}
                      {!visitesLoading && visites.length === 0 && (
                        <tr>
                          <td
                            colSpan={12}
                            className="px-4 py-6 text-center text-xs text-muted-foreground"
                          >
                            Aucune visite ne correspond à vos critères.
                          </td>
                        </tr>
                      )}
                      {!visitesLoading &&
                        visites.map((visite) => {
                          const canManage = canManageVisite(visite);

                          return (
                            <tr
                              key={visite.id}
                              className="border-t border-slate-100 hover:bg-blue-50/30 transition-all"
                            >
                              <td className="px-2 py-2.5 whitespace-nowrap">
                                <span className="text-[11px] xl:text-xs font-medium text-slate-700">
                                  {formatVisitDate(visite.date_visite)}
                                </span>
                              </td>
                              <td className="px-2 py-2.5">
                                <p className="text-[11px] xl:text-sm font-bold text-slate-900 truncate max-w-[140px] xl:max-w-[180px]">
                                  {visite.entreprise}
                                </p>
                              </td>
                              <td className="px-2 py-2.5">
                                <p className="text-[11px] xl:text-xs text-slate-700 truncate max-w-[120px] xl:max-w-[160px]">
                                  {visite.personne_rencontree}
                                </p>
                                {visite.fonction_poste && (
                                  <p className="text-[9px] xl:text-[10px] text-slate-500 truncate max-w-[120px] xl:max-w-[160px]">
                                    {visite.fonction_poste}
                                  </p>
                                )}
                              </td>                              <td className="px-2 py-2.5 hidden md:table-cell">
                                {visite.objet_visite ? (
                                  <div className="group relative">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-100">
                                      <Icon name="DocumentTextIcon" size={12} className="text-blue-400 flex-shrink-0 xl:w-4 xl:h-4" />
                                      <p className="text-[10px] xl:text-xs text-slate-700 truncate max-w-[140px] xl:max-w-[180px]">
                                        {visite.objet_visite}
                                      </p>
                                    </div>
                                    {/* Tooltip on hover */}
                                    {visite.objet_visite.length > 30 && (
                                      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                                        <div className="bg-slate-900 text-white text-[10px] xl:text-xs rounded-lg px-2 py-1.5 shadow-xl max-w-[200px] xl:max-w-[280px]">
                                          <p className="leading-relaxed">{visite.objet_visite}</p>
                                          <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">—</span>
                                )}
                              </td>                              <td className="px-2 py-2.5 text-[10px] xl:text-xs text-slate-600 hidden lg:table-cell truncate">
                                {visite.commercial_name || '—'}
                              </td>
                              <td className="px-2 py-2.5 text-[10px] xl:text-xs text-slate-600 hidden md:table-cell">
                                {visite.ville || '—'}
                              </td>
                              <td className="px-2 py-2.5 text-[10px] xl:text-xs text-slate-600 hidden xl:table-cell">
                                {visite.zone || '—'}
                              </td>
                              <td className="px-2 py-2.5">
                                {canManage ? (
                                  <div className="relative">
                                    <button
                                      onClick={() => setStatusMenuOpen(statusMenuOpen === visite.id ? null : visite.id)}
                                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] xl:text-xs font-semibold transition-all duration-200 min-w-[80px] xl:min-w-[90px] justify-center ${
                                        visite.statut_visite === 'a_faire'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                                          : visite.statut_visite === 'en_cours'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full ${
                                        visite.statut_visite === 'a_faire' ? 'bg-amber-500' :
                                        visite.statut_visite === 'en_cours' ? 'bg-blue-500' : 'bg-emerald-500'
                                      }" />
                                      <span>{visite.statut_visite === 'a_faire' ? 'À faire' : visite.statut_visite === 'en_cours' ? 'En cours' : 'Terminée'}</span>
                                      <Icon name="ChevronDownIcon" size={10} className="opacity-40 group-hover:opacity-70" />
                                    </button>
                                    
                                    {statusMenuOpen === visite.id && (
                                      <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setStatusMenuOpen(null)} />
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[101] w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 animate-fade-in">
                                          <button
                                            onClick={() => handleStatusChange(visite.id, 'a_faire')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-amber-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">À faire</span>
                                          </button>
                                          <button
                                            onClick={() => handleStatusChange(visite.id, 'en_cours')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-blue-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">En cours</span>
                                          </button>
                                          <button
                                            onClick={() => handleStatusChange(visite.id, 'termine')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-emerald-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">Terminée</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold ${
                                    visite.statut_visite === 'a_faire'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : visite.statut_visite === 'en_cours'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      visite.statut_visite === 'a_faire' ? 'bg-amber-500' :
                                      visite.statut_visite === 'en_cours' ? 'bg-blue-500' : 'bg-emerald-500'
                                    }`} />
                                    <span>{visite.statut_visite === 'a_faire' ? 'À faire' : visite.statut_visite === 'en_cours' ? 'En cours' : 'Terminée'}</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2.5">
                                {canManage ? (
                                  <div className="relative">
                                    <button
                                      onClick={() => setResultMenuOpen(resultMenuOpen === visite.id ? null : visite.id)}
                                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] xl:text-xs font-semibold transition-all duration-200 min-w-[85px] xl:min-w-[95px] justify-center ${
                                        visite.statut_action === 'en_attente'
                                          ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                          : visite.statut_action === 'accepte'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        visite.statut_action === 'en_attente' ? 'bg-slate-400' :
                                        visite.statut_action === 'accepte' ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`} />
                                      <span>{visite.statut_action === 'en_attente' ? 'En attente' : visite.statut_action === 'accepte' ? 'Acceptée' : 'Refusée'}</span>
                                      <Icon name="ChevronDownIcon" size={10} className="opacity-40 group-hover:opacity-70" />
                                    </button>
                                    
                                    {resultMenuOpen === visite.id && (
                                      <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setResultMenuOpen(null)} />
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[101] w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 animate-fade-in">
                                          <button
                                            onClick={() => handleResultChange(visite.id, 'en_attente')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-slate-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">En attente</span>
                                          </button>
                                          <button
                                            onClick={() => handleResultChange(visite.id, 'accepte')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-emerald-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">Acceptée</span>
                                          </button>
                                          <button
                                            onClick={() => handleResultChange(visite.id, 'refuse')}
                                            className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-rose-50 transition-colors flex items-center gap-2 group"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:scale-125 transition-transform" />
                                            <span className="text-slate-700 font-medium">Refusée</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold ${
                                    visite.statut_action === 'en_attente'
                                      ? 'bg-slate-50 text-slate-700 border border-slate-200'
                                      : visite.statut_action === 'accepte'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      visite.statut_action === 'en_attente' ? 'bg-slate-400' :
                                      visite.statut_action === 'accepte' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`} />
                                    <span>{visite.statut_action === 'en_attente' ? 'En attente' : visite.statut_action === 'accepte' ? 'Acceptée' : 'Refusée'}</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2.5 text-[10px] xl:text-xs font-semibold text-slate-700 hidden lg:table-cell whitespace-nowrap">
                                {canViewSensitive(visite)
                                  ? typeof visite.montant === 'number'
                                    ? `${visite.montant.toLocaleString('fr-FR')} DT`
                                    : '—'
                                  : typeof visite.montant === 'number'
                                  ? '*****'
                                  : '—'}
                              </td>
                              <td className="px-2 py-2.5 hidden lg:table-cell">
                                {canViewSensitive(visite)
                                  ? typeof visite.probabilite === 'number'
                                    ? <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] xl:text-xs font-bold">{visite.probabilite}%</span>
                                    : '—'
                                  : typeof visite.probabilite === 'number'
                                  ? '*****'
                                  : '—'}
                              </td>
                              <td className="px-2 py-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Bouton RDV avec tooltip */}
                                  <div className="relative group">
                                    <button
                                      type="button"
                                      className="relative inline-flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                      onClick={() => {
                                        setRdvCardOpen(visite.id);
                                        setSelectedVisiteName(visite.entreprise);
                                        setSelectedVisiteData(visite);
                                      }}
                                      aria-label="Voir les rendez-vous"
                                    >
                                      <Icon name="EyeIcon" className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                                      {rdvCounts[visite.id] > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[8px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                                          {rdvCounts[visite.id]}
                                        </span>
                                      )}
                                    </button>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      Rendez-vous
                                    </div>
                                  </div>

                                  {canManage && (
                                    <>
                                      {/* Bouton Edit avec tooltip */}
                                      <div className="relative group">
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-500 hover:text-white hover:border-slate-500 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                          onClick={() => {
                                            router.push(`/visit-form?edit=${visite.id}`);
                                          }}
                                          aria-label="Modifier la visite"
                                        >
                                          <Icon name="PencilSquareIcon" className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                                        </button>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                          Modifier
                                        </div>
                                      </div>

                                      {/* Bouton Delete avec tooltip */}
                                      <div className="relative group">
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                          onClick={async () => {
                                            if (!confirm('Êtes-vous sûr de vouloir supprimer cette visite ?')) {
                                              return;
                                            }
                                            try {
                                              const response = await fetch(`/api/visites/delete?id=${visite.id}`, {
                                                method: 'DELETE',
                                              });
                                              if (response.ok) {
                                                success('Visite supprimée avec succès.');
                                                setTimeout(() => window.location.reload(), 500);
                                              } else {
                                                const errorData = await response.json().catch(() => ({}));
                                                error(errorData.error || 'Impossible de supprimer la visite.');
                                              }
                                            } catch (err) {
                                              error('Erreur lors de la suppression de la visite.');
                                            }
                                          }}
                                          aria-label="Supprimer la visite"
                                        >
                                          <Icon name="TrashIcon" className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                                        </button>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                          Supprimer
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 mt-4 text-xs md:flex-row md:text-sm">
                  <p className="text-muted-foreground font-body">
                    Page {page}
                    {totalVisites !== null && pageSize
                      ? ` sur ${Math.max(1, Math.ceil(totalVisites / pageSize))}`
                      : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || visitesLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-cta disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-smooth"
                    >
                      <Icon name="ChevronLeftIcon" size={14} />
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (totalVisites === null) {
                          setPage((p) => p + 1);
                          return;
                        }
                        const maxPage = Math.max(1, Math.ceil(totalVisites / pageSize));
                        setPage((p) => Math.min(maxPage, p + 1));
                      }}
                      disabled={
                        visitesLoading ||
                        (totalVisites !== null && pageSize
                          ? page >= Math.max(1, Math.ceil(totalVisites / pageSize))
                          : false)
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-cta disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-smooth"
                    >
                      Suivant
                      <Icon name="ChevronRightIcon" size={14} />
                    </button>
                  </div>
                </div>
                {visitesError && (
                  <p className="mt-3 text-xs text-destructive font-body">
                    {visitesError}
                  </p>
                )}
              </div>

              {/* Bloc inférieur : Widgets "Dashboard" Modernes (Hauteur Fixe & Contenu Dense) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
                
                {/* Widget: Activité Récente (Style Timeline Scrollable) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[420px] flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Icon name="ClockIcon" size={18} />
                      </div>
                      <h2 className="text-base font-bold text-slate-800">Activité Récente</h2>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Icon name="ArrowPathIcon" size={18} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent p-0">
                    <div className="p-5 pt-6">
                      {recentActivities.map((activity) => (
                        <ActivityItem key={activity.id} {...activity} />
                      ))}
                      {/* Decorative empty state if needed */}
                      <div className="pl-6 pt-2 pb-4">
                        <div className="text-xs text-slate-400 italic flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                           Fin de l'historique récent
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget: Équipe (Grille Compacte Scrollable) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[420px] flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Icon name="UsersIcon" size={18} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Mon Équipe</h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                          {(teamMembersState ?? teamMembers).filter(m => m.role === 'commercial' || m.role === 'Commercial').length}
                        </span>
                      </div>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        Voir tout
                      </button>
                    </div>
                    
                    {/* Légende des indicateurs */}
                    <div className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                          <span className="text-[10px] font-medium text-slate-600">Par semaine (24)</span>
                        </div>
                      </div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                          <span className="text-[10px] font-medium text-slate-600">Par mois (96)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-slate-50/30">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                      {equipeLoading && (
                        <div className="col-span-2 py-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-xs text-slate-500">Chargement de l'équipe...</p>
                        </div>
                      )}
                      
                      {equipeError && !equipeLoading && (
                        <div className="col-span-2 py-8 text-center text-red-500 text-sm">
                           {equipeError}
                        </div>
                      )}
                      
                      {/* Carte Membre - Version Compacte via Grid - Uniquement Commerciaux */}
                      {(!equipeLoading && !equipeError) && (teamMembersState ?? teamMembers).filter(member => member.role === 'commercial' || member.role === 'Commercial').map((member) => (
                        <div key={member.id} className="h-full">
                           <TeamMemberCard {...member} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="mt-8 bg-card rounded-2xl p-6 shadow-elevated border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-foreground">Carte des Visites</h2>
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-cta text-sm hover:bg-primary hover:text-white transition-smooth">
                    Aujourd'hui
                  </button>
                  <button className="px-4 py-2 rounded-lg text-muted-foreground font-cta text-sm hover:bg-muted transition-smooth">
                    Cette Semaine
                  </button>
                  <button className="px-4 py-2 rounded-lg text-muted-foreground font-cta text-sm hover:bg-muted transition-smooth">
                    Ce Mois
                  </button>
                </div>
              </div>
              <div className="w-full h-96 rounded-xl overflow-hidden border border-border">
               <iframe
  width="100%"
  height="100%"
  loading="lazy"
  title="Carte des Visites Commerciales"
  referrerPolicy="no-referrer-when-downgrade"
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3192.345209316102!2d10.181806275839527!3d36.85815506443056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd35005d7865af%3A0x8807dbfc5a563f39!2sTAGSTREAM!5e0!3m2!1sen!2stn!4v1767671984852!5m2!1sen!2stn"
  className="w-full h-full"
>
</iframe>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* RDV List Card */}
      {rdvCardOpen && selectedVisiteData && (
        <RdvListCard
          visiteId={rdvCardOpen}
          visiteName={selectedVisiteName}
          visiteData={selectedVisiteData}
          isOpen={true}
          onClose={() => {
            setRdvCardOpen(null);
            setSelectedVisiteData(null);
            // Recharger les compteurs RDV après fermeture
            const fetchRdvCounts = async () => {
              const counts: Record<string, number> = {};
              await Promise.all(
                visites.map(async (visite) => {
                  try {
                    const rdvResponse = await fetch(`/api/rendez-vous?visite_id=${visite.id}`);
                    if (rdvResponse.ok) {
                      const rdvJson = await rdvResponse.json();
                      counts[visite.id] = rdvJson.data?.length || 0;
                    }
                  } catch (err) {
                    counts[visite.id] = 0;
                  }
                })
              );
              setRdvCounts(counts);
            };
            fetchRdvCounts();
          }}
        />
      )}
      </div>
    </>
  );
}