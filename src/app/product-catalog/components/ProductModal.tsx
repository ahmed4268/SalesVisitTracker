'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Product, ProductFamily } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product;
  families: { id: string; nom: string }[];
  categories: { id: string; nom: string }[];
  onClose: () => void;
  onSave: (product: any) => Promise<void>;
}

export default function ProductModal({
  isOpen,
  product,
  families,
  categories,
  onClose,
  onSave,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    designation: '',
    reference: '',
    description: '',
    famille_id: '',
    categorie_id: '',
    frequence: 'Standard',
    prix_ht: 0,
    prix_ttc: 0,
    image_url: '',
    actif: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        designation: product.name,
        reference: product.reference,
        description: product.description,
        famille_id: '', // To be set from product.family
        categorie_id: product.category,
        frequence: product.frequency,
        prix_ht: product.priceHT,
        prix_ttc: product.priceTTC,
        image_url: product.image,
        actif: product.inStock,
      });
    } else {
      setFormData({
        designation: '',
        reference: '',
        description: '',
        famille_id: '',
        categorie_id: '',
        frequence: 'Standard',
        prix_ht: 0,
        prix_ttc: 0,
        image_url: '',
        actif: true,
      });
    }
    setError('');
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        ...formData,
        id: product?.id,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-screen max-w-2xl rounded-2xl shadow-2xl border border-gray-300 z-50 p-6 bg-white max-h-[90vh] overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-xl font-display font-bold text-gray-900">
              {product ? 'Éditer le produit' : 'Nouveau produit'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Designation */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Désignation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  placeholder="Ex: RFID Reader 16 ports"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  placeholder="Ex: TG-468XJ-1"
                />
              </div>

              {/* Famille */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Famille *
                </label>
                <select
                  name="famille_id"
                  value={formData.famille_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                >
                  <option value="">Sélectionner une famille</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Catégorie *
                </label>
                <select
                  name="categorie_id"
                  value={formData.categorie_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {/* Prix HT */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Prix HT (DT)
                </label>
                <input
                  type="number"
                  name="prix_ht"
                  value={formData.prix_ht}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>

              {/* Prix TTC */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Prix TTC (DT)
                </label>
                <input
                  type="number"
                  name="prix_ttc"
                  value={formData.prix_ttc}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>

              {/* Fréquence */}
              <div>
                <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                  Fréquence
                </label>
                <input
                  type="text"
                  name="frequence"
                  value={formData.frequence}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  placeholder="Ex: UHF, LF"
                />
              </div>

              {/* Actif */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="actif"
                    checked={formData.actif}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-cta text-gray-900">En stock</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                rows={3}
                placeholder="Description du produit"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-cta font-semibold text-gray-900 mb-1">
                URL de l'image
              </label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                placeholder="https://..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-cta text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-cta text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'En cours...' : product ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
