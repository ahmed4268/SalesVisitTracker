'use client';

import { useState } from 'react';
import { 
  Building2, User, Calendar, Target, TrendingUp, 
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Sparkles, Phone, Mail, MapPin, DollarSign, Clock,
  FileText, Tag, Briefcase, Save
} from 'lucide-react';

type Step = 'client' | 'visite' | 'suivi';

export default function ModernVisitForm() {
  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [formData, setFormData] = useState({
    entreprise: '',
    personne_rencontree: '',
    fonction_poste: '',
    ville: '',
    tel_fixe: '',
    mobile: '',
    email: '',
    date_visite: '',
    objet_visite: '',
    provenance_contact: '',
    interet_client: '',
    montant: '',
    probabilite: 50,
    statut_visite: 'a_faire',
    statut_action: 'en_attente'
  });

  const steps = [
    { id: 'client' as Step, title: 'Client', icon: Building2, color: 'blue' },
    { id: 'visite' as Step, title: 'Visite', icon: Calendar, color: 'purple' },
    { id: 'suivi' as Step, title: 'Suivi', icon: TrendingUp, color: 'green' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        entreprise: formData.entreprise,
        personne_rencontree: formData.personne_rencontree,
        date_visite: formData.date_visite,
        objet_visite: formData.objet_visite,
        statut_visite: formData.statut_visite,
        statut_action: formData.statut_action,
        fonction_poste: formData.fonction_poste || undefined,
        ville: formData.ville || undefined,
        tel_fixe: formData.tel_fixe || undefined,
        mobile: formData.mobile || undefined,
        email: formData.email || undefined,
        provenance_contact: formData.provenance_contact || undefined,
        interet_client: formData.interet_client || undefined,
        montant: formData.montant !== '' ? Number(formData.montant) : undefined,
        probabilite: formData.probabilite,
      };

      const response = await fetch('/api/visites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors de la création de la visite:', errorText);
        alert("Impossible d'enregistrer la visite.");
        return;
      }

      setFormData({
        entreprise: '',
        personne_rencontree: '',
        fonction_poste: '',
        ville: '',
        tel_fixe: '',
        mobile: '',
        email: '',
        date_visite: '',
        objet_visite: '',
        provenance_contact: '',
        interet_client: '',
        montant: '',
        probabilite: 50,
        statut_visite: 'a_faire',
        statut_action: 'en_attente',
      });
      setCurrentStep('client');
      alert('Visite enregistrée avec succès.');
    } catch (error) {
      console.error('Erreur inattendue lors de la création de la visite:', error);
      alert("Erreur inattendue lors de l'enregistrement de la visite.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header avec animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Nouvelle visite</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Créer une visite commerciale
          </h1>
          <p className="text-gray-600">
            Suivez les étapes pour enregistrer votre visite client
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110' 
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </button>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-4 rounded-full transition-all duration-300
                      ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            
            {/* Step: Client */}
            {currentStep === 'client' && (
              <div className="p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Informations Client</h2>
                    <p className="text-gray-600 text-sm">Qui allez-vous rencontrer ?</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de l'entreprise *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.entreprise}
                        onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                        placeholder="Ex: TechCorp Solutions"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Personne rencontrée *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.personne_rencontree}
                        onChange={(e) => setFormData({...formData, personne_rencontree: e.target.value})}
                        placeholder="Nom et prénom"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fonction / Poste
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fonction_poste}
                        onChange={(e) => setFormData({...formData, fonction_poste: e.target.value})}
                        placeholder="Ex: Directeur Commercial"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ville
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => setFormData({...formData, ville: e.target.value})}
                        placeholder="Ex: Tunis"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone fixe
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.tel_fixe}
                        onChange={(e) => setFormData({...formData, tel_fixe: e.target.value})}
                        placeholder="+216 71 000 000"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        placeholder="+216 20 000 000"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="contact@entreprise.com"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Visite */}
            {currentStep === 'visite' && (
              <div className="p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Détails de la Visite</h2>
                    <p className="text-gray-600 text-sm">Contexte et objectifs</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de visite *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date_visite}
                        onChange={(e) => setFormData({...formData, date_visite: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Provenance du contact
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.provenance_contact}
                        onChange={(e) => setFormData({...formData, provenance_contact: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all appearance-none bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        <option>Prospection à froid</option>
                        <option>Recommandation</option>
                        <option>Salon / Événement</option>
                        <option>Site web</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Objet de la visite *
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={formData.objet_visite}
                        onChange={(e) => setFormData({...formData, objet_visite: e.target.value})}
                        placeholder="Décrivez l'objectif principal de cette visite..."
                        rows={4}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Intérêt du client
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Très élevé', 'Élevé', 'Moyen', 'Faible'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, interet_client: level})}
                          className={`
                            px-4 py-2 rounded-lg font-medium text-sm transition-all
                            ${formData.interet_client === level
                              ? 'bg-purple-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Montant potentiel (DT)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.montant}
                        onChange={(e) => setFormData({...formData, montant: e.target.value})}
                        placeholder="5000"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Suivi */}
            {currentStep === 'suivi' && (
              <div className="p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Suivi & Probabilité</h2>
                    <p className="text-gray-600 text-sm">Évaluez les chances de succès</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Probabilité de conclusion
                      </label>
                      <span className="text-2xl font-bold text-green-600">
                        {formData.probabilite}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.probabilite}
                      onChange={(e) => setFormData({...formData, probabilite: Number(e.target.value)})}
                      className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Faible</span>
                      <span>Moyenne</span>
                      <span>Élevée</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Statut de la visite
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'a_faire', label: 'À faire', color: 'blue' },
                        { value: 'en_cours', label: 'En cours', color: 'yellow' },
                        { value: 'termine', label: 'Terminée', color: 'green' }
                      ].map(({ value, label, color }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData({...formData, statut_visite: value})}
                          className={`
                            px-6 py-3 rounded-xl font-semibold transition-all
                            ${formData.statut_visite === value
                              ? `bg-${color}-600 text-white shadow-lg scale-105`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Résultat attendu
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'en_attente', label: 'En attente' },
                        { value: 'accepte', label: 'Acceptée' },
                        { value: 'refuse', label: 'Refusée' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData({...formData, statut_action: value})}
                          className={`
                            px-6 py-3 rounded-xl font-semibold transition-all
                            ${formData.statut_action === value
                              ? 'bg-green-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2">Récapitulatif</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Entreprise:</strong> {formData.entreprise || 'Non renseigné'}</p>
                          <p><strong>Contact:</strong> {formData.personne_rencontree || 'Non renseigné'}</p>
                          <p><strong>Date:</strong> {formData.date_visite || 'Non planifiée'}</p>
                          <p><strong>Probabilité:</strong> {formData.probabilite}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Précédent
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
                >
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer la visite
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tips Card */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Astuce</h3>
              <p className="text-sm text-gray-600">
                Plus vous renseignez d'informations détaillées, plus vos statistiques et prévisions seront précises dans SalesTracker.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}