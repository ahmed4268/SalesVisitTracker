'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../../../components/ui/AppIcon';
import type { StatsVisites, Visite, EquipeMember } from '@/types/database';

import KPICard from './KPICard';
import ActivityItem from './ActivityItem';
import UpcomingVisitCard from './UpcomingVisitCard';
import QuickActionButton from './QuickActionButton';
import PerformanceChart from './PerformanceChart';
import TeamMemberCard from './TeamMemberCard';

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
}

interface ChartDataPoint {
  month: string;
  visits: number;
  conversions: number;
}

export default function DashboardInteractive() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

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
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [equipeLoading, setEquipeLoading] = useState(false);
  const [equipeError, setEquipeError] = useState<string | null>(null);
  const [teamMembersState, setTeamMembersState] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    setIsHydrated(true);
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
  ]);

  // Récupération de l'équipe réelle
  useEffect(() => {
    if (!isHydrated) return;

    const fetchEquipe = async () => {
      try {
        setEquipeLoading(true);
        setEquipeError(null);

        const response = await fetch('/api/equipe');
        if (!response.ok) {
          console.error("Erreur lors du chargement de l'équipe:", await response.text());
          setEquipeError("Impossible de charger les membres de l'équipe.");
          return;
        }

        const json = await response.json();
        const equipe = (json?.data ?? []) as EquipeMember[];

        if (!equipe.length) {
          setTeamMembersState([]);
          return;
        }

        const baseAvatars: TeamMember[] = [
          {
            id: 1,
            name: "Sophie Martin",
            role: "Responsable Commercial",
            avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a9e8814c-1763296696290.png",
            avatarAlt: "Professional headshot of woman with long brown hair in business attire smiling at camera",
            visitsToday: 8,
            status: 'active'
          },
          {
            id: 2,
            name: "Marc Dubois",
            role: "Représentant Senior",
            avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_196174460-1763296831663.png",
            avatarAlt: "Professional portrait of man with short dark hair in navy suit with confident expression",
            visitsToday: 6,
            status: 'active'
          },
          {
            id: 3,
            name: "Julie Rousseau",
            role: "Analyste Commercial",
            avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ab364902-1763296135947.png",
            avatarAlt: "Business portrait of woman with blonde hair in professional attire with warm smile",
            visitsToday: 4,
            status: 'away'
          },
          {
            id: 4,
            name: "Thomas Bernard",
            role: "Représentant",
            avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4ab3fb5-1763296572207.png",
            avatarAlt: "Professional headshot of man with beard in gray blazer looking at camera",
            visitsToday: 5,
            status: 'active'
          }
        ];

        const mapped: TeamMember[] = equipe.map((member, index) => {
          const baseAvatar = baseAvatars[index % baseAvatars.length];
          const fullName = `${member.prenom ?? ''} ${member.nom ?? ''}`.trim();

          let displayRole: string;
          if (member.role === 'superieur') {
            displayRole = 'Manager';
          } else if (member.role === 'commercial') {
            displayRole = 'Commercial';
          } else {
            displayRole = member.role || 'Collaborateur';
          }

          return {
            id: index + 1,
            name: fullName || member.email || 'Utilisateur',
            role: displayRole,
            avatar: baseAvatar.avatar,
            avatarAlt: baseAvatar.avatarAlt,
            visitsToday: member.total_visites ?? 0,
            status: 'active',
          };
        });

        setTeamMembersState(mapped);
      } catch (error) {
        console.error("Erreur réseau lors du chargement de l'équipe:", error);
        setEquipeError("Erreur réseau lors du chargement de l'équipe.");
      } finally {
        setEquipeLoading(false);
      }
    };

    fetchEquipe();
  }, [isHydrated]);

  const kpiData: KPIData[] = [
    {
      title: "Visites Totales",
      value: "1,247",
      change: 12.5,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      trend: 'up',
      color: 'from-primary to-secondary'
    },
    {
      title: "Taux de Conversion",
      value: "68.4%",
      change: 8.2,
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      trend: 'up',
      color: 'from-secondary to-accent'
    },
    {
      title: "Nouveaux Clients",
      value: "342",
      change: 15.3,
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      trend: 'up',
      color: 'from-accent to-primary'
    },
    {
      title: "Revenu Mensuel",
      value: "€89,420",
      change: -3.1,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      trend: 'down',
      color: 'from-primary to-accent'
    }
  ];

  const getKpiData = (): KPIData[] => {
    if (!stats) {
      return kpiData;
    }

    const total = stats.total_visites || 0;
    const terminees = stats.visites_terminees || 0;
    const baseTotal = terminees > 0 ? terminees : total;
    const tauxConversion =
      baseTotal > 0 ? (stats.visites_acceptees / baseTotal) * 100 : 0;

    return [
      {
        ...kpiData[0],
        value: total.toLocaleString('fr-FR'),
      },
      {
        ...kpiData[1],
        title: 'Taux de Conversion',
        value: `${tauxConversion.toFixed(1)}%`,
      },
      {
        ...kpiData[2],
        title: 'Montant Potentiel',
        value: `${stats.montant_total.toLocaleString('fr-FR')} DT`,
      },
      {
        ...kpiData[3],
        title: 'Probabilité Moyenne',
        value: `${stats.probabilite_moyenne.toFixed(1)}%`,
      },
    ];
  };

  const recentActivities: Activity[] = [
    {
      id: 1,
      user: "Sophie Martin",
      action: "a complété une visite chez TechCorp Solutions",
      time: "Il y a 5 minutes",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a9e8814c-1763296696290.png",
      avatarAlt: "Professional headshot of woman with long brown hair in business attire smiling at camera",
      type: 'visit'
    },
    {
      id: 2,
      user: "Marc Dubois",
      action: "a ajouté un nouveau client: Innovation Labs",
      time: "Il y a 12 minutes",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_196174460-1763296831663.png",
      avatarAlt: "Professional portrait of man with short dark hair in navy suit with confident expression",
      type: 'client'
    },
    {
      id: 3,
      user: "Julie Rousseau",
      action: "a généré un rapport de performance trimestriel",
      time: "Il y a 28 minutes",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ab364902-1763296135947.png",
      avatarAlt: "Business portrait of woman with blonde hair in professional attire with warm smile",
      type: 'report'
    },
    {
      id: 4,
      user: "Thomas Bernard",
      action: "a planifié 3 nouvelles visites pour demain",
      time: "Il y a 1 heure",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4ab3fb5-1763296572207.png",
      avatarAlt: "Professional headshot of man with beard in gray blazer looking at camera",
      type: 'visit'
    }
  ];

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Sophie Martin",
      role: "Responsable Commercial",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a9e8814c-1763296696290.png",
      avatarAlt: "Professional headshot of woman with long brown hair in business attire smiling at camera",
      visitsToday: 8,
      status: 'active'
    },
    {
      id: 2,
      name: "Marc Dubois",
      role: "Représentant Senior",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_196174460-1763296831663.png",
      avatarAlt: "Professional portrait of man with short dark hair in navy suit with confident expression",
      visitsToday: 6,
      status: 'active'
    },
    {
      id: 3,
      name: "Julie Rousseau",
      role: "Analyste Commercial",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ab364902-1763296135947.png",
      avatarAlt: "Business portrait of woman with blonde hair in professional attire with warm smile",
      visitsToday: 4,
      status: 'away'
    },
    {
      id: 4,
      name: "Thomas Bernard",
      role: "Représentant",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4ab3fb5-1763296572207.png",
      avatarAlt: "Professional headshot of man with beard in gray blazer looking at camera",
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
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative">
        {/* Main Content */}
        <main className="pt-24 pb-12 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
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

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
              {getKpiData().map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
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

                  <div className="flex flex-col w-full gap-3 md:w-auto md:flex-row">
                    <div className="relative flex-1 min-w-[180px]">
                      <Icon
                        name="MagnifyingGlassIcon"
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setPage(1);
                          setSearchTerm(e.target.value);
                        }}
                        placeholder="Rechercher une entreprise ou un contact..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={statutVisiteFilter}
                        onChange={(e) => {
                          setPage(1);
                          setStatutVisiteFilter(e.target.value);
                        }}
                        className="px-3 py-2 rounded-xl bg-muted text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 text-foreground min-w-[150px]"
                      >
                        <option value="">Tous les statuts de visite</option>
                        <option value="a_faire">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminée</option>
                      </select>

                      <select
                        value={statutActionFilter}
                        onChange={(e) => {
                          setPage(1);
                          setStatutActionFilter(e.target.value);
                        }}
                        className="px-3 py-2 rounded-xl bg-muted text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 text-foreground min-w-[150px]"
                      >
                        <option value="">Tous les résultats</option>
                        <option value="en_attente">En attente</option>
                        <option value="accepte">Acceptée</option>
                        <option value="refuse">Refusée</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 mb-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">
                      Date min
                    </label>
                    <input
                      type="date"
                      value={fromFilter}
                      onChange={(e) => {
                        setPage(1);
                        setFromFilter(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 text-foreground"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">
                      Date max
                    </label>
                    <input
                      type="date"
                      value={toFilter}
                      onChange={(e) => {
                        setPage(1);
                        setToFilter(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 text-foreground"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-muted/60">
                      <tr className="text-left text-[11px] md:text-xs text-muted-foreground font-cta">
                        <th className="px-3 py-2.5 md:px-4">Date</th>
                        <th className="px-3 py-2.5 md:px-4">Entreprise</th>
                        <th className="px-3 py-2.5 md:px-4">Contact</th>
                        <th className="px-3 py-2.5 md:px-4 hidden lg:table-cell">Commercial</th>
                        <th className="px-3 py-2.5 md:px-4 hidden md:table-cell">Ville</th>
                        <th className="px-3 py-2.5 md:px-4">Statut</th>
                        <th className="px-3 py-2.5 md:px-4 hidden sm:table-cell">
                          Résultat
                        </th>
                        <th className="px-3 py-2.5 md:px-4 hidden lg:table-cell">
                          Montant
                        </th>
                        <th className="px-3 py-2.5 md:px-4 hidden lg:table-cell">
                          Prob.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitesLoading && (
                        <tr>
                          <td
                            colSpan={9}

                            className="px-4 py-6 text-center text-xs text-muted-foreground"
                          >
                            Chargement des visites...
                          </td>
                        </tr>
                      )}
                      {!visitesLoading && visites.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}

                            className="px-4 py-6 text-center text-xs text-muted-foreground"
                          >
                            Aucune visite ne correspond à vos critères.
                          </td>
                        </tr>
                      )}
                      {!visitesLoading &&
                        visites.map((visite) => (
                          <tr
                            key={visite.id}
                            className="border-t border-border/60 hover:bg-muted/40 transition-smooth"
                          >
                            <td className="px-3 py-3 md:px-4 whitespace-nowrap">
                              <span className="font-cta text-xs md:text-sm text-foreground">
                                {formatVisitDate(visite.date_visite)}
                              </span>
                            </td>
                            <td className="px-3 py-3 md:px-4 max-w-[160px] md:max-w-[200px]">
                              <p className="text-xs md:text-sm font-cta font-semibold text-foreground truncate">
                                {visite.entreprise}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {visite.objet_visite}
                              </p>
                            </td>
                            <td className="px-3 py-3 md:px-4 max-w-[140px] md:max-w-[180px]">
                              <p className="text-xs md:text-sm text-foreground truncate">
                                {visite.personne_rencontree}
                              </p>
                              {visite.fonction_poste && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {visite.fonction_poste}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 md:px-4 text-[11px] md:text-xs text-muted-foreground hidden lg:table-cell">
                              {visite.commercial_name || '—'}
                            </td>
                            <td className="px-3 py-3 md:px-4 text-xs text-muted-foreground hidden md:table-cell">
                              {visite.ville || '—'}
                            </td>
                            <td className="px-3 py-3 md:px-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] md:text-[11px] font-cta ${
                                  visite.statut_visite === 'a_faire'
                                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                    : visite.statut_visite === 'en_cours'
                                    ? 'bg-primary/15 text-primary border border-primary/30'
                                    : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                }`}
                              >
                                {visite.statut_visite === 'a_faire'
                                  ? 'À faire'
                                  : visite.statut_visite === 'en_cours'
                                  ? 'En cours'
                                  : 'Terminée'}
                              </span>
                            </td>
                            <td className="px-3 py-3 md:px-4 hidden sm:table-cell">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] md:text-[11px] font-cta ${
                                  visite.statut_action === 'en_attente'
                                    ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                                    : visite.statut_action === 'accepte'
                                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                }`}
                              >
                                {visite.statut_action === 'en_attente'
                                  ? 'En attente'
                                  : visite.statut_action === 'accepte'
                                  ? 'Acceptée'
                                  : 'Refusée'}
                              </span>
                            </td>
                            <td className="px-3 py-3 md:px-4 text-xs text-foreground hidden lg:table-cell whitespace-nowrap">
                              {typeof visite.montant === 'number'
                                ? `${visite.montant.toLocaleString('fr-FR')} DT`
                                : '—'}
                            </td>
                            <td className="px-3 py-3 md:px-4 text-xs text-foreground hidden lg:table-cell">
                              {typeof visite.probabilite === 'number'
                                ? `${visite.probabilite}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
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

              {/* Bloc inférieur : Activité récente & Équipe côte à côte */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Activité Récente */}
                <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-foreground">
                      Activité Récente
                    </h2>
                    <button className="p-2 rounded-lg hover:bg-muted transition-smooth">
                      <Icon name="ArrowPathIcon" size={20} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentActivities.map((activity) => (
                      <ActivityItem key={activity.id} {...activity} />
                    ))}
                  </div>
                </div>

                {/* Équipe */}
                <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-foreground">Équipe</h2>
                    <button className="text-sm font-cta font-semibold text-primary hover:text-secondary transition-smooth">
                      Voir Tout
                    </button>
                  </div>
                  <div className="space-y-4">
                    {equipeLoading && (
                      <p className="text-xs text-muted-foreground font-body">
                        Chargement de l'équipe...
                      </p>
                    )}
                    {equipeError && !equipeLoading && (
                      <p className="text-xs text-destructive font-body">
                        {equipeError}
                      </p>
                    )}
                    {(teamMembersState ?? teamMembers).map((member) => (
                      <TeamMemberCard key={member.id} {...member} />
                    ))}
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
                  src="https://www.google.com/maps?q=48.8566,2.3522&z=12&output=embed"
                  className="w-full h-full">
                </iframe>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>);

}