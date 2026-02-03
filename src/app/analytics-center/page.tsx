import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import AnalyticsInteractive from './components/AnalyticsInteractive';

export const metadata: Metadata = {
  title: "Centre d'Analyse - SalesTracker Pro",
  description:
    "Accédez à des visualisations avancées en 3D et des rapports interactifs pour analyser les performances de vente, la productivité de l'équipe et les tendances d'engagement client en temps réel.",
};

export default function AnalyticsCenterPage() {
  return (
    <>
      <Header />
      <AnalyticsInteractive />
    </>
  );
}
