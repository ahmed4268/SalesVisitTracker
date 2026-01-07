import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import VisitFormInteractive from './components/VisitFormInteractive';

export const metadata: Metadata = {
  title: 'Créer une Visite - SalesTracker Pro',
  description:
    'Créez et documentez vos visites clients avec notre système de suivi avancé. Interface multi-étapes avec recherche intelligente de clients, téléchargement de médias et validation en temps réel.',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function VisitFormPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <VisitFormInteractive />
      </Suspense>
    </>
  );
}