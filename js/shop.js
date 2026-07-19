/* ==========================================================================
   AURA ATELIER - SHOP CONTROLLER
   ========================================================================== */

import { fetchProducts } from './products-data.js';
import { Store } from './store.js';
import { showToast, openQuickView } from './main.js';

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 12;
let currentView = 'grid-3'; // 'grid-3', 'grid-4', 'list'

const filters = {
  search: '',
  categories: [],
  maxPrice: 15000,
  minRating: 0,
  inStockOnly: false,
  onSaleOnly: false,
  sortBy: 'featured'
};

export async function initShop() {
  allProducts = await fetchProducts();

  // Read URL query params e.g. shop.html?category=Sofas
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    filters.categories = [categoryParam];
  }
  const searchParam = urlParams.get('search');
  if (searchParam) {
    filters.search = searchParam;
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) searchInput.value = searchParam;
  }

  setupEventListeners();
  renderCategorySidebar();
  applyFilters();
  setupMobileFilterToggle();
}

function setupMobileFilterToggle() {
  const filterBar = document.getElementById('mobile-filter-bar');
  const sidebar = document.getElementById('shop-sidebar');
  const toggleBtn = document.getElementById('filter-toggle-mobile-btn');

  // Show the mobile filter bar on small screens
  const updateFilterBarVisibility = () => {
    if (filterBar) {
      filterBar.style.display = window.innerWidth <= 768 ? 'block' : 'none';
    }
    // Reset sidebar on resize back to desktop
    if (window.innerWidth > 768 && sidebar) {
      sidebar.classList.remove('sidebar-open');
      document.body.style.overflow = '';
      const backdrop = document.getElementById('sidebar-backdrop');
      if (backdrop) backdrop.classList.remove('active');
    }
  };

  updateFilterBarVisibility();
  window.addEventListener('resize', updateFilterBarVisibility);

  // Create backdrop for sidebar
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9989;display:none;';
    document.body.appendChild(backdrop);
  }

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('sidebar-open');
    backdrop.classList.remove('active');
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
  };

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      if (!sidebar) return;
      const isOpen = sidebar.classList.contains('sidebar-open');
      if (isOpen) {
        closeSidebar();
      } else {
        sidebar.classList.add('sidebar-open');
        backdrop.style.display = 'block';
        setTimeout(() => backdrop.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
      }
    };
  }

  backdrop.onclick = closeSidebar;

  // Close sidebar when a filter is applied on mobile
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  }
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filters.search = e.target.value.toLowerCase();
      currentPage = 1;
      applyFilters();
    });
  }

  // Price slider
  const priceSlider = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-range-val');
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      filters.maxPrice = Number(e.target.value);
      if (priceDisplay) priceDisplay.textContent = `$${filters.maxPrice.toLocaleString()}`;
      currentPage = 1;
      applyFilters();
    });
  }

  // Rating radio/checkboxes
  document.querySelectorAll('.rating-filter-opt').forEach(opt => {
    opt.addEventListener('change', (e) => {
      filters.minRating = Number(e.target.value);
      currentPage = 1;
      applyFilters();
    });
  });

  // Availability checkboxes
  const inStockCb = document.getElementById('filter-instock');
  if (inStockCb) {
    inStockCb.addEventListener('change', (e) => {
      filters.inStockOnly = e.target.checked;
      currentPage = 1;
      applyFilters();
    });
  }

  const onSaleCb = document.getElementById('filter-onsale');
  if (onSaleCb) {
    onSaleCb.addEventListener('change', (e) => {
      filters.onSaleOnly = e.target.checked;
      currentPage = 1;
      applyFilters();
    });
  }

  // Clear Filters
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filters.search = '';
      filters.categories = [];
      filters.maxPrice = 15000;
      filters.minRating = 0;
      filters.inStockOnly = false;
      filters.onSaleOnly = false;
      filters.sortBy = 'featured';

      if (searchInput) searchInput.value = '';
      if (priceSlider) priceSlider.value = 15000;
      if (priceDisplay) priceDisplay.textContent = '$15,000';
      if (inStockCb) inStockCb.checked = false;
      if (onSaleCb) onSaleCb.checked = false;

      document.querySelectorAll('.category-cb').forEach(cb => cb.checked = false);
      const sortSelect = document.getElementById('shop-sort-select');
      if (sortSelect) sortSelect.value = 'featured';

      currentPage = 1;
      applyFilters();
    });
  }

  // Sort Select
  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filters.sortBy = e.target.value;
      applyFilters();
    });
  }

  // View switchers
  const btnGrid3 = document.getElementById('view-grid-3');
  const btnGrid4 = document.getElementById('view-grid-4');
  const btnList = document.getElementById('view-list');

  if (btnGrid3) {
    btnGrid3.onclick = () => {
      currentView = 'grid-3';
      updateViewBtns(btnGrid3, btnGrid4, btnList);
      renderProductsGrid();
    };
  }
  if (btnGrid4) {
    btnGrid4.onclick = () => {
      currentView = 'grid-4';
      updateViewBtns(btnGrid4, btnGrid3, btnList);
      renderProductsGrid();
    };
  }
  if (btnList) {
    btnList.onclick = () => {
      currentView = 'list';
      updateViewBtns(btnList, btnGrid3, btnGrid4);
      renderProductsGrid();
    };
  }
}

function updateViewBtns(active, ...others) {
  active.classList.add('btn-gold');
  active.classList.remove('btn-glass');
  others.forEach(b => {
    if (b) {
      b.classList.remove('btn-gold');
      b.classList.add('btn-glass');
    }
  });
}

function renderCategorySidebar() {
  const container = document.getElementById('category-filter-list');
  if (!container) return;

  const categories = ['Furniture', 'Sofas', 'Dining Tables', 'Beds', 'Lights', 'Curtains', 'Wallpaper', 'Decor', 'Plants', 'Kitchen Accessories', 'Office Furniture'];
  
  const categoryCounts = {};
  categories.forEach(c => categoryCounts[c] = 0);
  allProducts.forEach(p => {
    if (categoryCounts[p.category] !== undefined) categoryCounts[p.category]++;
  });

  container.innerHTML = categories.map(cat => {
    const isChecked = filters.categories.includes(cat);
    return `
      <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; color: var(--text-light-secondary); cursor: pointer; padding: 0.35rem 0;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <input type="checkbox" class="category-cb" value="${cat}" ${isChecked ? 'checked' : ''} style="accent-color: var(--gold-primary); width: 16px; height: 16px;">
          <span>${cat}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-light-muted); background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 10px;">${categoryCounts[cat]}</span>
      </label>
    `;
  }).join('');

  container.querySelectorAll('.category-cb').forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked) {
        filters.categories.push(e.target.value);
      } else {
        filters.categories = filters.categories.filter(c => c !== e.target.value);
      }
      currentPage = 1;
      applyFilters();
    });
  });
}

function applyFilters() {
  filteredProducts = allProducts.filter(p => {
    // Search filter
    if (filters.search) {
      const matchName = p.name.toLowerCase().includes(filters.search);
      const matchCat = p.category.toLowerCase().includes(filters.search);
      const matchDesc = p.shortDescription.toLowerCase().includes(filters.search);
      if (!matchName && !matchCat && !matchDesc) return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(p.category)) return false;
    }

    // Price filter
    if (p.price > filters.maxPrice) return false;

    // Rating filter
    if (filters.minRating > 0 && p.rating < filters.minRating) return false;

    // Stock & Sale
    if (filters.inStockOnly && !p.inStock) return false;
    if (filters.onSaleOnly && (!p.discount || p.discount <= 0)) return false;

    return true;
  });

  // Sorting
  if (filters.sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (filters.sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  } else if (filters.sortBy === 'newest') {
    filteredProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  // Update total results counter
  const resultsCounter = document.getElementById('shop-results-count');
  if (resultsCounter) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    resultsCounter.textContent = filteredProducts.length > 0 
      ? `Showing ${start}-${end} of ${filteredProducts.length} Atelier Masterpieces`
      : `0 products found`;
  }

  renderProductsGrid();
  renderPagination();
}

function renderProductsGrid() {
  const container = document.getElementById('shop-products-grid');
  if (!container) return;

  if (filteredProducts.length === 0) {
    container.className = '';
    container.innerHTML = `
      <div class="glass-panel-dark" style="text-align: center; padding: 4rem 2rem; width: 100%;">
        <i class="fas fa-compass-drafting text-gold" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h3 style="color: #FFF; font-family: var(--font-heading); margin-bottom: 0.5rem;">No Atelier Pieces Match Your Filter Criteria</h3>
        <p style="color: var(--text-light-muted); margin-bottom: 1.5rem;">Try adjusting your price range, clearing categories, or searching another keyword.</p>
        <button id="reset-empty-btn" class="btn btn-gold">Reset All Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('reset-empty-btn');
    if (resetBtn) resetBtn.onclick = () => document.getElementById('clear-filters-btn').click();
    return;
  }

  // Apply layout class
  if (currentView === 'grid-3') {
    container.className = 'grid grid-cols-3';
  } else if (currentView === 'grid-4') {
    container.className = 'grid grid-cols-4';
  } else {
    container.className = 'grid grid-cols-1';
  }

  const start = (currentPage - 1) * itemsPerPage;
  const pageProducts = filteredProducts.slice(start, start + itemsPerPage);

  container.innerHTML = pageProducts.map(p => {
    const inWish = Store.isInWishlist(p.id);

    if (currentView === 'list') {
      return `
        <div class="glass-card-gold" style="display: flex; gap: 2rem; padding: 1.5rem; align-items: center;">
          <div style="width: 240px; height: 180px; flex-shrink: 0; border-radius: 8px; overflow: hidden; position: relative;">
            <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="flex-grow: 1;">
            <span style="color: var(--gold-primary); font-size: 0.75rem; text-transform: uppercase;">${p.category}</span>
            <h3 style="font-family: var(--font-heading); color: #FFF; font-size: 1.25rem; margin: 0.25rem 0 0.5rem 0;"><a href="product.html?id=${p.id}">${p.name}</a></h3>
            <p style="color: var(--text-light-muted); font-size: 0.875rem; margin-bottom: 1rem; max-width: 600px;">${p.shortDescription}</p>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="font-size: 1.35rem; font-weight: 700; color: var(--gold-primary);">$${p.price.toLocaleString()}</span>
              ${p.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-light-muted);">$${p.originalPrice.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; min-width: 160px;">
            <button class="btn btn-gold" onclick="addShopCart(${p.id})">Add To Cart</button>
            <button class="btn btn-glass" onclick="openQuickView(${p.id})"><i class="fas fa-eye"></i> Quick View</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-img product-img-main" loading="lazy">
          <img src="${p.hoverImage || p.image}" alt="${p.name}" class="product-img product-img-hover" loading="lazy">
          <div class="card-badges">
            ${p.isNew ? `<span class="badge-tag badge-new">NEW</span>` : ''}
            ${p.discount ? `<span class="badge-tag badge-discount">-${p.discount}%</span>` : ''}
          </div>
          <div class="card-floating-actions">
            <button class="floating-btn ${inWish ? 'active' : ''}" onclick="toggleShopWish(event, ${p.id})">
              <i class="fa${inWish ? 's' : 'r'} fa-heart"></i>
            </button>
            <button class="floating-btn" onclick="openQuickView(${p.id})">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <div class="rating-row">
            <span class="stars"><i class="fas fa-star"></i> ${p.rating}</span>
            <span class="review-count">(${p.reviewCount})</span>
          </div>
          <div class="price-row">
            <span class="current-price">$${p.price.toLocaleString()}</span>
            ${p.originalPrice ? `<span class="original-price">$${p.originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <button class="btn btn-gold add-cart-btn-card" onclick="addShopCart(${p.id})">Add To Cart</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPagination() {
  const container = document.getElementById('shop-pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  // Prev button
  html += `<button class="btn btn-glass btn-icon" ${currentPage === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} id="pag-prev"><i class="fas fa-chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="btn ${i === currentPage ? 'btn-gold' : 'btn-glass'}" style="min-width: 42px; height: 42px; padding: 0;" data-page="${i}">${i}</button>
    `;
  }

  // Next button
  html += `<button class="btn btn-glass btn-icon" ${currentPage === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} id="pag-next"><i class="fas fa-chevron-right"></i></button>`;

  container.innerHTML = html;

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.onclick = () => {
      currentPage = Number(btn.dataset.page);
      applyFilters();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    };
  });

  const prevBtn = document.getElementById('pag-prev');
  if (prevBtn && currentPage > 1) {
    prevBtn.onclick = () => {
      currentPage--;
      applyFilters();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    };
  }

  const nextBtn = document.getElementById('pag-next');
  if (nextBtn && currentPage < totalPages) {
    nextBtn.onclick = () => {
      currentPage++;
      applyFilters();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    };
  }
}

// Global helpers for inline triggers
window.addShopCart = (id) => {
  Store.addToCart(id, 1);
  showToast('Item added to your shopping bag!');
};

window.toggleShopWish = (e, id) => {
  if (e) e.preventDefault();
  const added = Store.toggleWishlist(id);
  showToast(added ? 'Saved to Wishlist!' : 'Removed from Wishlist');
  renderProductsGrid();
};

document.addEventListener('DOMContentLoaded', initShop);
