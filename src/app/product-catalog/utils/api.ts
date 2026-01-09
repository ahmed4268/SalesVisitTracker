import { Product, ProductFamily } from '../types';

// Cache global pour les catégories
let categoryCache: Record<string, string> = {};

/**
 * Transforme les données de l'API Supabase vers le format du design
 */
export function transformApiProductToDesign(apiProduct: any): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.designation,
    reference: apiProduct.reference || '',
    description: apiProduct.description || '',
    family: getFamilyName(apiProduct.famille_id) as ProductFamily,
    category: apiProduct.categorie_id || 'Non catégorisé', // Store raw ID, don't transform
    frequency: apiProduct.frequence || 'Standard',
    priceTTC: apiProduct.prix_ttc || 0,
    priceHT: apiProduct.prix_ht || 0,
    image: apiProduct.image_url || '/assets/images/no_image.jpeg',
    alt: apiProduct.designation,
    badge: undefined,
    inStock: apiProduct.actif === true,
  };
}

/**
 * Mapper les IDs de famille aux noms de famille
 * À adapter selon votre structure de données réelle
 */
function getFamilyName(familleId: string | undefined): ProductFamily {
  if (!familleId) return 'SERRURES';
  
  // Map direct si les IDs correspondent
  const familyMap: Record<string, ProductFamily> = {
    'SERRURES': 'SERRURES',
    'READER': 'READER',
    'ETIQUETTES': 'ETIQUETTES',
    'famille-serrures': 'SERRURES',
    'famille-reader': 'READER',
    'famille-etiquettes': 'ETIQUETTES',
  };
  
  return familyMap[familleId] || 'SERRURES';
}

/**
 * Mapper les IDs de catégorie aux noms de catégorie
 */
function getCategoryName(categorieId: string | undefined): string {
  if (!categorieId) return 'Non catégorisé';
  
  // Si on a le mapping en cache, l'utiliser
  if (categoryCache[categorieId]) {
    return categoryCache[categorieId];
  }
  
  // Sinon retourner l'ID (il sera remplacé une fois que les catégories sont chargées)
  return categorieId;
}

/**
 * Récupère les produits depuis l'API avec gestion d'erreur
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/catalogue/produits');
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    const apiProducts = data.data || [];
    
    // Transform with raw category IDs (mapping done in component)
    const products = apiProducts.map(transformApiProductToDesign);
    
    // Deduplicate by ID - keep only the first occurrence
    const seenIds = new Set<string>();
    const uniqueProducts = products.filter((product: Product) => {
      if (seenIds.has(product.id)) {
        console.warn(`Duplicate product found with ID: ${product.id}, removing...`);
        return false;
      }
      seenIds.add(product.id);
      return true;
    });
    
    console.log(`Fetched ${apiProducts.length} products, kept ${uniqueProducts.length} unique products`);
    return uniqueProducts;
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error);
    throw error;
  }
}

/**
 * Charge les noms des catégories depuis l'API
 */
async function loadCategoryNames(): Promise<void> {
  try {
    const response = await fetch('/api/catalogue/categories');
    
    if (!response.ok) {
      console.warn('Impossible de charger les catégories');
      return;
    }
    
    const data = await response.json();
    const categories = data.data || [];
    
    // Créer un mapping ID -> Nom
    categories.forEach((cat: any) => {
      // La table categories_produits a un champ "nom"
      categoryCache[cat.id] = cat.nom || cat.designation || cat.id;
    });
  } catch (error) {
    console.warn('Erreur lors du chargement des catégories:', error);
  }
}

/**
 * Récupère les produits avec filtres optionnels
 */
export async function fetchProductsFiltered(params?: {
  famille_id?: string;
  categorie_id?: string;
  search?: string;
}): Promise<Product[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.famille_id) queryParams.append('famille_id', params.famille_id);
    if (params?.categorie_id) queryParams.append('categorie_id', params.categorie_id);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/api/catalogue/produits${queryParams.toString() ? '?' + queryParams : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    const apiProducts = data.data || [];
    
    return apiProducts.map(transformApiProductToDesign);
  } catch (error) {
    console.error('Erreur lors du chargement des produits filtrés:', error);
    throw error;
  }
}
