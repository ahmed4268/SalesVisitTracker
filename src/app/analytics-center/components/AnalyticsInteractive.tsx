'use client';

import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/AppIcon';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import FilterButton from './FilterButton';
import PerformanceChart from './PerformanceChart';
import RevenueChart from './RevenueChart';
import TeamPerformanceTable from './TeamPerformanceTable';
import ExportButton from './ExportButton';
import type { StatsVisites } from '@/types/database';

interface PerformanceData {
  month: string;
  visits: number;
  conversions: number;
  revenue: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

interface TeamMember {
  id: number;
  name: string;
  image: string;
  alt: string;
  visits: number;
  conversions: number;
  revenue: number;
  performance: number;
}

export default function AnalyticsInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [stats, setStats] = useState<StatsVisites | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const response = await fetch('/api/visites/stats');
        if (!response.ok) {
          console.error('Erreur lors du chargement des statistiques de visites (analytics):', await response.text());
          setStatsError("Impossible de charger les statistiques de vos visites.");
          return;
        }

        const data = (await response.json()) as StatsVisites;
        setStats(data);
      } catch (error) {
        console.error('Erreur réseau lors du chargement des statistiques de visites (analytics):', error);
        setStatsError("Erreur réseau lors du chargement des statistiques.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isHydrated, timeFilter]);

  const performanceData: PerformanceData[] = [
    { month: 'Jan', visits: 245, conversions: 89, revenue: 156 },
    { month: 'Fév', visits: 312, conversions: 124, revenue: 198 },
    { month: 'Mar', visits: 289, conversions: 98, revenue: 167 },
    { month: 'Avr', visits: 356, conversions: 145, revenue: 223 },
    { month: 'Mai', visits: 398, conversions: 167, revenue: 267 },
    { month: 'Juin', visits: 423, conversions: 189, revenue: 298 }
  ];

  const revenueData: RevenueData[] = [
    { month: 'Jan', revenue: 156, target: 180 },
    { month: 'Fév', revenue: 198, target: 200 },
    { month: 'Mar', revenue: 167, target: 190 },
    { month: 'Avr', revenue: 223, target: 210 },
    { month: 'Mai', revenue: 267, target: 250 },
    { month: 'Juin', revenue: 298, target: 280 }
  ];

  const teamData: TeamMember[] = [
    {
      id: 1,
      name: 'Sophie Martin',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_145063ccb-1763295272227.png",
      alt: 'Femme professionnelle aux cheveux bruns en tailleur noir souriant dans un bureau moderne',
      visits: 156,
      conversions: 67,
      revenue: 134,
      performance: 92
    },
    {
      id: 2,
      name: 'Thomas Dubois',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_187c00342-1763296247276.png",
      alt: 'Homme d\'affaires en chemise bleue avec lunettes souriant dans un environnement professionnel',
      visits: 142,
      conversions: 58,
      revenue: 118,
      performance: 85
    },
    {
      id: 3,
      name: 'Marie Laurent',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d8bbfe7d-1763296604767.png",
      alt: 'Femme d\'affaires blonde en veste grise avec un sourire confiant dans un cadre corporatif',
      visits: 134,
      conversions: 52,
      revenue: 106,
      performance: 78
    },
    {
      id: 4,
      name: 'Pierre Rousseau',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_14d350b04-1767292815017.png",
      alt: 'Homme professionnel en costume gris foncé avec cravate bleue dans un bureau élégant',
      visits: 128,
      conversions: 49,
      revenue: 98,
      performance: 74
    }
  ];

  const metrics = [
    {
      title: 'Total des visites',
      value: '2,023',
      change: 12.5,
      trend: 'up' as const,
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
    },
    {
      title: 'Taux de conversion',
      value: '42.8%',
      change: 8.3,
      trend: 'up' as const,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Chiffre d\'affaires',
      value: '1,309k€',
      change: 15.7,
      trend: 'up' as const,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Clients actifs',
      value: '847',
      change: -3.2,
      trend: 'down' as const,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    }
  ];

  const getMetrics = () => {
    if (!stats) {
      return metrics;
    }

    const total = stats.total_visites || 0;
    const terminees = stats.visites_terminees || 0;
    const baseTotal = terminees > 0 ? terminees : total;
    const tauxConversion =
      baseTotal > 0 ? (stats.visites_acceptees / baseTotal) * 100 : 0;

    const montantK = stats.montant_total / 1000;

    return [
      {
        ...metrics[0],
        value: total.toLocaleString('fr-FR'),
      },
      {
        ...metrics[1],
        value: `${tauxConversion.toFixed(1)}%`,
      },
      {
        ...metrics[2],
        value: `${montantK.toFixed(1)}k DT`,
      },
      metrics[3],
    ];
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!isHydrated) return;
    console.log(`Exportation en format: ${format}`);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) =>
                <div key={i} className="h-40 bg-muted rounded-2xl"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Centre d'Analyse
            </h1>
            <p className="text-muted-foreground font-body">
              Visualisations avancées et rapports de performance en temps réel
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ExportButton onExport={handleExport} />
            <button className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-smooth font-cta font-medium text-sm">
              <Icon name="AdjustmentsHorizontalIcon" size={18} />
              <span>Filtres</span>
            </button>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center space-x-3 mb-8 overflow-x-auto pb-2">
          <FilterButton
            label="Cette semaine"
            active={timeFilter === 'week'}
            onClick={() => setTimeFilter('week')} />

          <FilterButton
            label="Ce mois"
            active={timeFilter === 'month'}
            onClick={() => setTimeFilter('month')} />

          <FilterButton
            label="Ce trimestre"
            active={timeFilter === 'quarter'}
            onClick={() => setTimeFilter('quarter')} />

          <FilterButton
            label="Cette année"
            active={timeFilter === 'year'}
            onClick={() => setTimeFilter('year')} />

        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
          {getMetrics().map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
        {statsLoading && (
          <p className="mb-6 text-sm text-muted-foreground font-body">
            Chargement des statistiques de visites...
          </p>
        )}
        {statsError && !statsLoading && (
          <p className="mb-6 text-sm text-destructive font-body">
            {statsError}
          </p>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard
            title="Performance Mensuelle"
            subtitle="Visites et conversions par mois">

            <PerformanceChart data={performanceData} />
          </ChartCard>

          <ChartCard
            title="Évolution du Chiffre d'Affaires"
            subtitle="Comparaison avec les objectifs">

            <RevenueChart data={revenueData} />
          </ChartCard>
        </div>

        {/* Team Performance Table */}
        <ChartCard
          title="Performance de l'Équipe"
          subtitle="Classement des membres par performance">

          <TeamPerformanceTable data={teamData} />
        </ChartCard>

        {/* Floating Particles Effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/20 rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent/20 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>);

}