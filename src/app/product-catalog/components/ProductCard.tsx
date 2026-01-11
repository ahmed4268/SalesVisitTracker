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

  // Vitality & Professionalism: Slightly richer backgrounds but still subtle
  const familyBgStyles: Record<string, string> = {
    SERRURES: 'bg-gradient-to-b from-blue-50/50 to-white', // Softer vertical gradient
    READER: 'bg-gradient-to-b from-purple-50/50 to-white',
    ETIQUETTES: 'bg-gradient-to-b from-emerald-50/50 to-white',
  };

  const familyHoverBorder: Record<string, string> = {
    SERRURES: 'group-hover:border-blue-200',
    READER: 'group-hover:border-purple-200',
    ETIQUETTES: 'group-hover:border-emerald-200',
  };

  const familyTextColors: Record<string, string> = {
    SERRURES: 'text-blue-600 bg-blue-50 border-blue-100',
    READER: 'text-purple-600 bg-purple-50 border-purple-100',
    ETIQUETTES: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100 ${
        familyHoverBorder[product.family] || 'group-hover:border-gray-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Image Area - Clean & Balanced */}
      <div className={`relative h-64 rounded-t-2xl overflow-hidden flex items-center justify-center p-6 ${
        familyBgStyles[product.family] || 'bg-gray-50'
      }`}>
        
        {/* Glow effect matching family */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${
             product.family === 'READER' ? 'from-purple-50/30' : 
             product.family === 'ETIQUETTES' ? 'from-emerald-50/30' : 
             'from-blue-50/30'
        } to-transparent`} />

        <img
          src={product.image}
          alt={product.alt}
          className={`relative z-10 w-full h-full object-contain transition-transform duration-500 ease-out ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Floating Top Bar */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
            {/* Family Tag - Clean Pill */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                familyTextColors[product.family] || 'text-gray-500 bg-gray-50 border-gray-200'
            }`}>
                {product.family}
            </span>

            {/* Stock Indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm`}>
                <div className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-medium text-gray-600">
                  {product.inStock ? 'Stock' : 'Cmde'}
                </span>
            </div>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-mono text-gray-400">{product.reference}</p>
                 {product.badge && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">
                        {product.badge}
                    </span>
                )}
            </div>
            
            <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                {product.name}
            </h3>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
             <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-gray-900">
                    {product.priceTTC.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-medium text-gray-400">DT</span>
             </div>

            {/* Actions or Frequency */}
            <div className="flex items-center gap-2">
                {isAdmin ? (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <Icon name="PencilIcon" size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(product); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Icon name="TrashIcon" size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium">
                        {product.frequency || '-'}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}