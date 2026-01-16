'use client';

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface TeamMemberCardProps {
  id: number;
  name: string;
  role: string;
  avatar: string;
  avatarAlt: string;
  visitsToday: number;
  status: 'active' | 'away' | 'offline';
  mustChangePassword?: boolean;
}

export default function TeamMemberCard({ 
  id,
  name, 
  role, 
  avatar, 
  avatarAlt, 
  visitsToday, 
  status,
  mustChangePassword
}: TeamMemberCardProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const statusColors = {
    active: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-400'
  };

  const statusLabels = {
    active: 'En ligne',
    away: 'Occupé',
    offline: 'Hors ligne'
  };

  const handleResetPassword = async () => {
    try {
      // Call backend API to actually reset the password
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: String(id)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erreur lors de la réinitialisation du mot de passe.');
        return;
      }

      // Show the real temporary password from backend
      setTempPassword(data.tempPassword);
      setShowResetModal(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Erreur lors de la réinitialisation du mot de passe.');
    }
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
    }
  };

  // Objectifs : 24 visites/semaine et 96 visites/mois
  const weeklyTarget = 24;
  const monthlyTarget = 96;
  
  // Pour l'instant, on utilise visitsToday comme nombre de visites du mois
  // (le backend pourrait être amélioré pour fournir visitsThisWeek et visitsThisMonth)
  const visitsThisMonth = visitsToday;
  // Estimation : on suppose qu'on est à environ 1/4 du mois
  const visitsThisWeek = Math.floor(visitsToday / 4);
  
  const weeklyProgress = Math.min((visitsThisWeek / weeklyTarget) * 100, 100);
  const monthlyProgress = Math.min((visitsThisMonth / monthlyTarget) * 100, 100);

  return (
    <>
      <div className="group relative flex items-center p-3 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
        
        {/* Avatar Section */}
        <div className="relative flex-shrink-0 mr-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-100 group-hover:ring-blue-100 transition-all">
             <AppImage
               src={avatar}
               alt={avatarAlt}
               className="w-full h-full object-cover"
             />
          </div>
          <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-[3px] border-white ${statusColors[status]} flex items-center justify-center shadow-sm`}>
             {status === 'active' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
              {name}
            </h4>
            {mustChangePassword && (
               <div className="flex-shrink-0" title="Mot de passe à changer">
                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-semibold text-slate-500 border border-slate-100 uppercase tracking-wide">
              {role}
            </span>
          </div>

          {/* Progress Section - Double Indicators (Seulement pour commerciaux) */}
          {(role === 'commercial' || role === 'Commercial') && (
          <div className="space-y-2">
            {/* Indicateur Hebdomadaire */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  <span className="font-bold">{visitsThisWeek}/{weeklyTarget}</span>
                </span>
                <span className={`text-[10px] font-bold ${
                  weeklyProgress >= 100 ? 'text-emerald-600' :
                  weeklyProgress >= 75 ? 'text-blue-600' :
                  weeklyProgress >= 50 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {Math.round(weeklyProgress)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${weeklyProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Indicateur Mensuel */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                  <span className="font-bold">{visitsThisMonth}/{monthlyTarget}</span>
                </span>
                <span className={`text-[10px] font-bold ${
                  monthlyProgress >= 100 ? 'text-emerald-600' :
                  monthlyProgress >= 75 ? 'text-purple-600' :
                  monthlyProgress >= 50 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {Math.round(monthlyProgress)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-purple-400 to-purple-500"
                  style={{ width: `${monthlyProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Action Button (Hidden until hover) */}
        <button 
          onClick={handleResetPassword}
          className="absolute top-3 right-3 p-2 rounded-xl bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-blue-600 hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
          title="Gérer les accès"
        >
          <Icon name="KeyIcon" size={18} />
        </button>
      </div>

      {/* Password Reset Modal - Professional Design */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                   <Icon name="ShieldCheckIcon" size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Accès Sécurisé</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Administration système</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 bg-white space-y-5">
              <div className="text-center">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
                    <Icon name="UserIcon" size={14} />
                    {name}
                 </div>
                 <p className="text-sm text-slate-600 leading-relaxed">
                   Un mot de passe temporaire a été généré. L'utilisateur sera <strong className="text-slate-900">forcé de le changer</strong> à sa prochaine connexion.
                 </p>
              </div>

              {/* Password Box */}
              <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl opacity-20 blur transition duration-200 group-hover:opacity-40"></div>
                 <div className="relative flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <code className="font-mono text-lg font-bold text-slate-700 tracking-wider">
                      {tempPassword}
                    </code>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm active:translate-y-0.5"
                      title="Copier"
                    >
                      <Icon name="DocumentDuplicateIcon" size={20} />
                    </button>
                 </div>
              </div>

              {/* Warning */}
              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                 <Icon name="LockClosedIcon" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                 <p className="text-xs text-amber-800 font-medium leading-snug">
                   Pour des raisons de sécurité, ce mot de passe n'est affiché qu'une seule fois. Veuillez le copier maintenant.
                 </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}