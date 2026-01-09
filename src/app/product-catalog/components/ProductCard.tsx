'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export default function ProductCard({ product, isAdmin, onEdit, onDelete }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const familyColors = {
    SERRURES: 'from-accent to-success',
    READER: 'from-secondary to-violet-vibrant',
    ETIQUETTES: 'from-warning to-cta-orange',
  };

  const familyBadgeColors = {
    SERRURES: 'bg-accent/10 text-accent border-accent/20',
    READER: 'bg-secondary/10 text-secondary border-secondary/20',
    ETIQUETTES: 'bg-warning/10 text-warning border-warning/20',
  };

  const handleAddToCart = () => {
    // Animation success
    alert(`${product.name} ajouté au panier!`);
  };

  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden shadow-elevated border border-border hover:shadow-2xl hover:border-accent/30 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-background overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.alt}
          className={`max-w-full max-h-full object-contain transition-transform duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-cta font-semibold border ${
            familyBadgeColors[product.family]
          }`}>
            {product.family}
          </span>
          {product.badge && (
            <span className="px-3 py-1 rounded-full text-xs font-cta font-semibold bg-warning/90 text-white border border-warning">
              {product.badge}
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        <div className="absolute top-3 right-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-cta font-bold ${
            product.inStock 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/50 border border-emerald-300' 
              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/50 border border-orange-300'
          }`}>
            {product.inStock ? '✓ En stock' : 'Sur commande'}
          </div>
        </div>

        {/* Glow Effect on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-accent/20 via-transparent to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-base font-display font-bold text-foreground mb-2 line-clamp-2 min-h-[2.5rem] text-center">
          {product.name}
        </h3>

        {/* RFID Frequency and Reference */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${
            familyColors[product.family]
          } bg-opacity-10 border border-accent/20 flex items-center gap-1.5`}>
            <Icon name="SignalIcon" size={14} className="text-accent" />
            <span className="text-xs font-cta font-semibold text-foreground">
              {product.frequency}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {product.reference}
          </span>
        </div>

        {/* Price */}
        <div className="mb-4 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg font-display font-bold text-foreground">
              {product.priceTTC.toFixed(2)}
            </span>
            <span className="text-sm font-cta font-semibold text-muted-foreground">
              DT
            </span>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              onClick={() => onEdit?.(product)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-cta text-xs transition-colors"
            >
              <Icon name="PencilIcon" size={14} />
              Éditer
            </button>
            <button
              onClick={() => onDelete?.(product)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-cta text-xs transition-colors"
            >
              <Icon name="TrashIcon" size={14} />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}