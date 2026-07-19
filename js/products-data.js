/* ==========================================================================
   AURA ATELIER - PRODUCTS DATA LOADER
   ========================================================================== */

let productsCache = null;

export async function fetchProducts() {
  if (productsCache) return productsCache;

  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) throw new Error('Failed to load products json');
    productsCache = await response.json();
    return productsCache;
  } catch (error) {
    console.error('Error fetching products dataset:', error);
    // Fallback empty array
    return [];
  }
}

export async function getProductById(id) {
  const products = await fetchProducts();
  return products.find(p => p.id === Number(id)) || null;
}

export async function getProductsByCategory(category) {
  const products = await fetchProducts();
  if (!category || category === 'All') return products;
  return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

export async function getFeaturedProducts() {
  const products = await fetchProducts();
  return products.filter(p => p.isFeatured);
}

export async function getPopularProducts() {
  const products = await fetchProducts();
  return products.filter(p => p.isPopular);
}

export async function getLatestProducts() {
  const products = await fetchProducts();
  return products.filter(p => p.isNew);
}

window.AuraProducts = {
  fetchProducts,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts,
  getLatestProducts
};
