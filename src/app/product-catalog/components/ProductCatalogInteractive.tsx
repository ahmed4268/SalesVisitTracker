'use client';

import { useState, useMemo, useEffect } from 'react';
import FilterBar from './FilterBar';
import ProductGrid from './ProductGrid';
import EmptyState from './EmptyState';
import ProductModal from './ProductModal';
import Icon from '@/components/ui/AppIcon';
import { Product, ProductFamily } from '../types';
import { fetchProducts } from '../utils/api';
import { useAuth } from '@/hooks/useAuth';

const ITEMS_PER_PAGE = 12;

interface CategoryMapping {
  id: string;
  nom: string;
  famille_id: string;
}

export default function ProductCatalogInteractive() {
  const { isAdmin } = useAuth();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<{ id: string; nom: string }[]>([]); // Raw categories
  const [allFamilies, setAllFamilies] = useState<{ id: string; nom: string }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<ProductFamily | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesRes = await fetch('/api/catalogue/categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const categories = categoriesData.data || [];
          setAllCategories(categories);
        }
        
        // Fetch families
        const familiesRes = await fetch('/api/catalogue/familles');
        if (familiesRes.ok) {
          const familiesData = await familiesRes.json();
          const families = familiesData.data || [];
          setAllFamilies(families);
        }
        
        // Fetch products
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setProducts([]);
      } finally {
        setLoading(false);
        setIsHydrated(true);
      }
    };

    loadData();
  }, []);

  // Get the category ID from the name (for filtering)
  const getCategoryIdFromName = (name: string): string => {
    const category = allCategories.find(cat => cat.nom === name);
    return category?.id || '';
  };

  // Get the category name from the ID (for display)
  const getCategoryNameFromId = (id: string): string => {
    const category = allCategories.find(cat => cat.id === id);
    return category?.nom || id;
  };

  // Handle product save (create or update)
  const handleSaveProduct = async (formData: any) => {
    try {
      const url = editingProduct ? `/api/catalogue/produits/${editingProduct.id}` : '/api/catalogue/produits';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      // Refresh products
      const data = await fetchProducts();
      setProducts(data);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      throw error;
    }
  };

  // Handle product delete
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/catalogue/produits/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      // Refresh products
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Filter products based on selections
  const filteredProducts = useMemo(() => {
    const selectedCategoryId = selectedCategory === 'ALL' ? 'ALL' : getCategoryIdFromName(selectedCategory);
    
    console.log('=== FILTERING ===');
    console.log('selectedFamily:', selectedFamily);
    console.log('selectedCategory:', selectedCategory);
    console.log('selectedCategoryId:', selectedCategoryId);
    console.log('allCategories:', allCategories);
    console.log('First product category:', products[0]?.category);
    
    const result = (products || [])?.filter((product) => {
      const matchesFamily = selectedFamily === 'ALL' || product?.family === selectedFamily;
      const matchesCategory = selectedCategoryId === 'ALL' || product?.category === selectedCategoryId;
      const matchesSearch = searchQuery === '' || 
        product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.reference?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesPrice = product?.priceTTC >= priceRange[0] && product?.priceTTC <= priceRange[1];
      
      return matchesFamily && matchesCategory && matchesSearch && matchesPrice;
    });
    
    console.log('Filtered results:', result.length);
    return result;
  }, [products, selectedFamily, selectedCategory, searchQuery, priceRange, allCategories]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filteredProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    
    // Double-check for duplicates before rendering
    const seen = new Set<string>();
    return paginated.filter(product => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFamily, selectedCategory, searchQuery]);

  // Get unique categories for selected family - using names not IDs
  const availableCategories = useMemo(() => {
    console.log('Calculating availableCategories with allCategories:', allCategories);
    
    // Just return all category names from the fetched data
    const names = allCategories
      .map(cat => cat.nom)
      .filter(nom => nom && nom !== 'Non catégorisé')
      .sort();
    
    console.log('Available category names:', names);
    return names;
  }, [allCategories]);

  // Reset category when family changes
  useEffect(() => {
    setSelectedCategory('ALL');
  }, [selectedFamily]);

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-accent/10 via-primary/5 to-warning/10 border-b border-border py-6 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex-1">
              Catalogue Produits
            </h1>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-cta text-sm font-semibold transition-all duration-200 shadow-lg whitespace-nowrap"
              >
                <Icon name="PlusIcon" size={18} />
                Ajouter
              </button>
            )}
          </div>
        </div>
        
        <FilterBar
          selectedFamily={selectedFamily}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          priceRange={priceRange}
          availableCategories={availableCategories}
          resultCount={filteredProducts?.length}
          onFamilyChange={setSelectedFamily}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onPriceChange={setPriceRange}
        />

        <main className="px-4 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            {paginatedProducts?.length > 0 ? (
              <>
                <ProductGrid 
                  products={paginatedProducts}
                  isAdmin={isAdmin}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />

                {/* Beautiful Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 flex flex-col items-center gap-6">
                    {/* Page Navigation - Classic Style */}
                    <div className="flex items-center justify-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-cta transition-all duration-200 ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        ← Préc
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => {
                          const pageNum = i + 1;
                          const isCurrentPage = pageNum === currentPage;
                          const isVisible = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                          
                          if (!isVisible) {
                            if (pageNum === currentPage - 2) {
                              return <span key="ellipsis-1" className="px-1 text-gray-400 text-sm">...</span>;
                            }
                            if (pageNum === currentPage + 2) {
                              return <span key="ellipsis-2" className="px-1 text-gray-400 text-sm">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-md text-sm font-cta transition-all duration-200 ${
                                isCurrentPage
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-cta transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Suiv →
                      </button>
                    </div>

                    {/* Results Summary - Subtle */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Affichage <span className="font-semibold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-<span className="font-semibold text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> sur <span className="font-semibold text-gray-700">{filteredProducts.length}</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState searchQuery={searchQuery} />
            )}
          </div>
        </main>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        product={editingProduct || undefined}
        families={allFamilies}
        categories={allCategories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}