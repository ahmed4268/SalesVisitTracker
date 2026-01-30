'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ParticleBackground from './ParticleBackground';
import FloatingOrbs from './FloatingOrbs';
import GlassmorphicCard from './GlassmorphicCard';
import LoginForm from './LoginForm';


export default function LoginInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-white/10 rounded-lg" />
              <div className="h-12 bg-white/10 rounded-lg" />
              <div className="h-12 bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <FloatingOrbs />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto space-y-8">

          <div className="text-center mb-8 animate-slide-in-from-top">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/assets/images/rfidia.png"
                alt="RFIDIA Technology"
                width={400}
                height={200}
                className="w-64 sm:w-72 md:w-80 h-auto drop-shadow-[0_0_40px_rgba(107,76,154,0.6)]"
                priority
              />
            </div>

            <h4 className="text-4xl font-bold text-white mb-2 tracking-tight">
              SalesTracker Pro
            </h4>
            <p className="text-slate-300 text-sm font-medium">
              Powered by RFIDIA Technology
            </p>
          </div>

          <GlassmorphicCard className="p-8 animate-slide-in-from-bottom">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Bienvenue</h2>
              <p className="text-slate-400 text-sm">
                Connectez-vous pour accéder à votre tableau de bord
              </p>
            </div>

            <LoginForm />
          </GlassmorphicCard>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <button className="hover:text-slate-300 transition-colors duration-300">
                Confidentialité
              </button>
              <span>•</span>
              <button className="hover:text-slate-300 transition-colors duration-300">
                Conditions
              </button>
              <span>•</span>
              <button className="hover:text-slate-300 transition-colors duration-300">
                Support
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              © 2026 SalesTracker Pro. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-20">
        <button className="group relative w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-110">
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}