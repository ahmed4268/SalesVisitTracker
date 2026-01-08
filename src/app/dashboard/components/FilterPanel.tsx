'use client';

import { useState } from 'react';
import Icon from '../../../components/ui/AppIcon';

interface FilterPanelProps {
  onApply: (filters: FilterState) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statutVisiteFilter: string;
  onStatutVisiteChange: (value: string) => void;
  statutActionFilter: string;
  onStatutActionChange: (value: string) => void;
  fromFilter: string;
  onFromChange: (value: string) => void;
  toFilter: string;
  onToChange: (value: string) => void;
  commercialFilter?: string;
  onCommercialChange?: (value: string) => void;
  commercials?: Array<{ id: string; name: string }>;
  isAdmin?: boolean;
}

export interface FilterState {
  search: string;
  statutVisite: string;
  statutAction: string;
  from: string;
  to: string;
  commercial?: string;
}

export default function FilterPanel({
  onApply,
  searchTerm,
  onSearchChange,
  statutVisiteFilter,
  onStatutVisiteChange,
  statutActionFilter,
  onStatutActionChange,
  fromFilter,
  onFromChange,
  toFilter,
  onToChange,
  commercialFilter = '',
  onCommercialChange,
  commercials = [],
  isAdmin = false,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    statutVisiteFilter,
    statutActionFilter,
    fromFilter,
    toFilter,
    commercialFilter,
  ].filter(Boolean).length;

  const handleReset = () => {
    onSearchChange('');
    onStatutVisiteChange('');
    onStatutActionChange('');
    onFromChange('');
    onToChange('');
    if (onCommercialChange) {
      onCommercialChange('');
    }
    onApply({
      search: '',
      statutVisite: '',
      statutAction: '',
      from: '',
      to: '',
      commercial: '',
    });
    setIsOpen(false);
  };

  const handleApply = () => {
    onApply({
      search: searchTerm,
      statutVisite: statutVisiteFilter,
      statutAction: statutActionFilter,
      from: fromFilter,
      to: toFilter,
      commercial: commercialFilter,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 font-cta text-sm transition-all duration-200"
      >
        <Icon name="AdjustmentsHorizontalIcon" size={18} />
        <span>Filtres</span>
        {activeFiltersCount > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel - Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Filter Panel - Content */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-screen max-w-sm rounded-2xl shadow-2xl border border-gray-300 z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: '#ffffff' }}>
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="text-lg font-display font-bold text-gray-900">
                Filtres avancés
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="block text-xs font-cta font-semibold text-gray-900">
                Recherche
              </label>
              <div className="relative">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Entreprise, contact..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Statut Visite */}
            <div className="space-y-2">
              <label className="block text-xs font-cta font-semibold text-gray-900">
                Statut de visite
              </label>
              <select
                value={statutVisiteFilter}
                onChange={(e) => onStatutVisiteChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Tous les statuts</option>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminée</option>
              </select>
            </div>

            {/* Statut Action */}
            <div className="space-y-2">
              <label className="block text-xs font-cta font-semibold text-gray-900">
                Résultat
              </label>
              <select
                value={statutActionFilter}
                onChange={(e) => onStatutActionChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Tous les résultats</option>
                <option value="en_attente">En attente</option>
                <option value="accepte">Acceptée</option>
                <option value="refuse">Refusée</option>
              </select>
            </div>

            {/* Commercial Filter - Pour tous les utilisateurs */}
            {onCommercialChange && commercials.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-cta font-semibold text-gray-900">
                  Commercial
                </label>
                <select
                  value={commercialFilter}
                  onChange={(e) => onCommercialChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Tous les commerciaux</option>
                  {commercials.map((commercial) => (
                    <option key={commercial.id} value={commercial.id}>
                      {commercial.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-cta font-semibold text-gray-900">
                  Du
                </label>
                <input
                  type="date"
                  value={fromFilter}
                  onChange={(e) => onFromChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-cta font-semibold text-gray-900">
                  Au
                </label>
                <input
                  type="date"
                  value={toFilter}
                  onChange={(e) => onToChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-cta text-sm transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-cta text-sm transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
