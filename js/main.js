/* ==========================================================================
   AURA ATELIER - GLOBAL MAIN JS
   ========================================================================== */

import { Store } from './store.js';
import { fetchProducts, getProductById } from './products-data.js';

// Global Toast System
export function showToast(message, icon = '✓') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-body">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}
window.showToast = showToast;

// Global Quick View Modal
export async function openQuickView(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'glass-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="glass-modal-content" style="max-width: 950px; padding: 2rem;">
      <button class="close-modal-btn" style="position: absolute; top: 1.5rem; right: 1.5rem; color: #FFF; font-size: 1.5rem; cursor: pointer; z-index: 10;">&times;</button>
      <div class="grid grid-cols-2" style="gap: 2rem; align-items: center;">
        <div class="quickview-gallery" style="position: relative;">
          <img id="qv-main-img" src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 8px; max-height: 420px; object-fit: cover;">
          ${product.gallery && product.gallery.length > 1 ? `
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; overflow-x: auto;">
              ${product.gallery.map(img => `
                <img src="${img}" class="qv-thumb" style="width: 70px; height: 70px; border-radius: 4px; cursor: pointer; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);">
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="quickview-info">
          <span style="color: var(--gold-primary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.15em;">${product.category}</span>
          <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: #FFF; margin: 0.5rem 0 1rem 0;">${product.name}</h2>
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--gold-primary);">$${product.price.toLocaleString()}</span>
            ${product.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-light-muted);">$${product.originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <p style="color: var(--text-light-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">${product.shortDescription}</p>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
            <label style="color: #FFF; font-size: 0.85rem;">Qty:</label>
            <div style="display: flex; align-items: center; border: 1px solid var(--border-gold); border-radius: 4px; overflow: hidden;">
              <button id="qv-qty-minus" style="padding: 0.5rem 0.8rem; color: #FFF;">-</button>
              <input id="qv-qty-input" type="number" value="1" min="1" style="width: 45px; text-align: center; color: #FFF;">
              <button id="qv-qty-plus" style="padding: 0.5rem 0.8rem; color: #FFF;">+</button>
            </div>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button id="qv-add-cart-btn" class="btn btn-gold" style="flex: 1;">Add To Cart</button>
            <button id="qv-wishlist-btn" class="btn btn-outline-gold" style="width: 50px; padding: 0;"><i class="far fa-heart"></i></button>
          </div>
          <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: var(--text-light-muted);">
            <a href="product.html?id=${product.id}" style="color: var(--gold-primary); text-decoration: underline;">View Full Specifications & Customer Reviews &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  // Event handlers for modal
  const closeBtn = modal.querySelector('.close-modal-btn');
  closeBtn.onclick = () => modal.classList.remove('active');

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };

  // Gallery thumb switch
  modal.querySelectorAll('.qv-thumb').forEach(thumb => {
    thumb.onclick = () => {
      modal.querySelector('#qv-main-img').src = thumb.src;
    };
  });

  // Quantity controls
  const qtyInput = modal.querySelector('#qv-qty-input');
  modal.querySelector('#qv-qty-minus').onclick = () => {
    if (qtyInput.value > 1) qtyInput.value = Number(qtyInput.value) - 1;
  };
  modal.querySelector('#qv-qty-plus').onclick = () => {
    qtyInput.value = Number(qtyInput.value) + 1;
  };

  // Add to cart
  modal.querySelector('#qv-add-cart-btn').onclick = () => {
    const qty = Number(qtyInput.value) || 1;
    Store.addToCart(product.id, qty);
    showToast(`Added ${qty}x "${product.name}" to cart!`);
    modal.classList.remove('active');
  };

  // Wishlist toggle
  const wishBtn = modal.querySelector('#qv-wishlist-btn');
  wishBtn.onclick = () => {
    const added = Store.toggleWishlist(product.id);
    showToast(added ? `Added to Wishlist!` : `Removed from Wishlist`);
  };
}
window.openQuickView = openQuickView;

// Global Search Overlay Modal
export function initSearchModal() {
  let searchModal = document.getElementById('search-modal');
  if (!searchModal) {
    searchModal = document.createElement('div');
    searchModal.id = 'search-modal';
    searchModal.className = 'glass-modal-backdrop';
    searchModal.innerHTML = `
      <div class="glass-modal-content" style="max-width: 650px; padding: 2rem;">
        <button class="close-search-btn" style="position: absolute; top: 1.5rem; right: 1.5rem; color: #FFF; font-size: 1.5rem; cursor: pointer;">&times;</button>
        <h3 style="font-family: var(--font-heading); color: var(--gold-primary); font-size: 1.2rem; margin-bottom: 1rem;">Search Luxury Atelier</h3>
        <input type="text" id="search-input" class="glass-input" placeholder="Search furniture, velvet sofas, chandeliers..." style="font-size: 1.1rem; padding: 1rem 1.25rem;">
        <div id="search-results" style="margin-top: 1.5rem; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;"></div>
      </div>
    `;
    document.body.appendChild(searchModal);
  }

  const closeBtn = searchModal.querySelector('.close-search-btn');
  closeBtn.onclick = () => searchModal.classList.remove('active');
  searchModal.onclick = (e) => {
    if (e.target === searchModal) searchModal.classList.remove('active');
  };

  const searchInput = searchModal.querySelector('#search-input');
  const resultsContainer = searchModal.querySelector('#search-results');

  searchInput.oninput = async (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      resultsContainer.innerHTML = '';
      return;
    }

    const products = await fetchProducts();
    const matched = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query)
    ).slice(0, 6);

    if (matched.length === 0) {
      resultsContainer.innerHTML = `<p style="color: var(--text-light-muted); font-size: 0.9rem; text-align: center; padding: 1rem;">No matching interior pieces found.</p>`;
      return;
    }

    resultsContainer.innerHTML = matched.map(p => `
      <a href="product.html?id=${p.id}" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); transition: border-color 0.2s;" onhover="this.style.borderColor='var(--gold-primary)'">
        <img src="${p.image}" alt="${p.name}" style="width: 55px; height: 55px; border-radius: 4px; object-fit: cover;">
        <div>
          <h4 style="color: #FFF; font-size: 0.95rem; font-family: var(--font-heading);">${p.name}</h4>
          <span style="color: var(--gold-primary); font-size: 0.8rem;">$${p.price.toLocaleString()}</span>
        </div>
      </a>
    `).join('');
  };
}

export function openSearchModal() {
  initSearchModal();
  const searchModal = document.getElementById('search-modal');
  searchModal.classList.add('active');
  setTimeout(() => {
    document.getElementById('search-input').focus();
  }, 100);
}
window.openSearchModal = openSearchModal;

// Header Badges Sync
export function updateBadges() {
  const cartBadge = document.getElementById('cart-badge');
  const wishlistBadge = document.getElementById('wishlist-badge');

  if (cartBadge) {
    const count = Store.getCartCount();
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  if (wishlistBadge) {
    const count = Store.getWishlistCount();
    wishlistBadge.textContent = count;
    wishlistBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Inject Shared Header & Footer if placeholder containers present
export function renderHeaderAndFooter() {
  const headerElem = document.getElementById('site-header');
  const footerElem = document.getElementById('site-footer');

  if (headerElem) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    headerElem.className = 'header header-glass';
    headerElem.innerHTML = `
      <div class="announcement-bar">
        <span>Complimentary White-Glove Delivery & Installation on Orders Over $2,500 &nbsp;|&nbsp; Code: LUXE2026</span>
      </div>
      <div class="container header-container">
        <a href="index.html" class="logo">
          <span class="logo-main">AURA</span>
          <span class="logo-sub">ATELIER INTERIORS</span>
        </a>
        <nav class="nav-links" id="main-nav">
          <a href="index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a>
          <a href="shop.html" class="nav-link ${currentPage === 'shop.html' ? 'active' : ''}">Shop Collection</a>
          <a href="wishlist.html" class="nav-link ${currentPage === 'wishlist.html' ? 'active' : ''}">Wishlist</a>
          <a href="contact.html" class="nav-link ${currentPage === 'contact.html' ? 'active' : ''}">Contact Concierge</a>
        </nav>
        <div class="header-actions">
          <button class="action-btn" onclick="openSearchModal()" title="Search">
            <i class="fas fa-search"></i>
          </button>
          <a href="wishlist.html" class="action-btn" title="Wishlist">
            <i class="far fa-heart"></i>
            <span class="badge" id="wishlist-badge">0</span>
          </a>
          <a href="cart.html" class="action-btn" title="Shopping Cart">
            <i class="fas fa-shopping-bag"></i>
            <span class="badge" id="cart-badge">0</span>
          </a>
          <a href="login.html" class="action-btn" title="Account">
            <i class="far fa-user"></i>
          </a>
          <button class="mobile-toggle" id="mobile-menu-btn" style="background: none; border: none; font-size: 1.5rem; color: #FFF;">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
    `;

    // Mobile nav toggle
    const mobBtn = document.getElementById('mobile-menu-btn');
    const navBackdrop = document.createElement('div');
    navBackdrop.id = 'nav-backdrop';
    document.body.appendChild(navBackdrop);

    const closeMobileNav = () => {
      const nav = document.getElementById('main-nav');
      if (nav) nav.classList.remove('mobile-open');
      navBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (mobBtn) {
      mobBtn.onclick = () => {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        const isOpen = nav.classList.contains('mobile-open');
        if (isOpen) {
          closeMobileNav();
          mobBtn.innerHTML = '<i class="fas fa-bars"></i>';
        } else {
          nav.classList.add('mobile-open');
          navBackdrop.classList.add('active');
          document.body.style.overflow = 'hidden';
          mobBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
      };
    }

    navBackdrop.onclick = () => {
      closeMobileNav();
      const mobBtn2 = document.getElementById('mobile-menu-btn');
      if (mobBtn2) mobBtn2.innerHTML = '<i class="fas fa-bars"></i>';
    };
  }

  if (footerElem) {
    footerElem.className = 'footer';
    footerElem.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <a href="index.html" class="logo" style="margin-bottom: 1.5rem;">
              <span class="logo-main">AURA</span>
              <span class="logo-sub">ATELIER INTERIORS</span>
            </a>
            <p>AURA Atelier designs and curates extraordinary living spaces worldwide. Sourced from Italian marble quarries, French velvet mills, and Kyoto woodworking studios.</p>
            <div class="social-icons">
              <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-pinterest-p"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Collections</h4>
            <div class="footer-links">
              <a href="shop.html?category=Sofas">Velvet Sofas</a>
              <a href="shop.html?category=Dining Tables">Marble Dining</a>
              <a href="shop.html?category=Lights">Brass Lighting</a>
              <a href="shop.html?category=Beds">Oak & Velvet Beds</a>
              <a href="shop.html?category=Decor">Architectural Decor</a>
              <a href="shop.html?category=Plants">Bespoke Plants</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Customer Care</h4>
            <div class="footer-links">
              <a href="contact.html">Private Concierge</a>
              <a href="contact.html#faqs">White-Glove Delivery</a>
              <a href="cart.html">Shopping Bag</a>
              <a href="wishlist.html">Saved Favorites</a>
              <a href="login.html">Client Portal</a>
              <a href="contact.html">Book Atelier Visit</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Atelier Newsletter</h4>
            <p>Subscribe to receive exclusive lookbooks, private salon invitations, and bespoke design insights.</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <input type="email" class="glass-input" placeholder="Enter your email..." style="padding: 0.75rem 1rem;">
              <button class="btn btn-gold" style="padding: 0.75rem 1.25rem;" onclick="showToast('Thank you for joining AURA Atelier newsletter!')">Join</button>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 AURA Atelier Luxury Interiors Ltd. All Rights Reserved.</span>
          <div style="display: flex; gap: 1.5rem;">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Preferences</span>
          </div>
        </div>
      </div>
    `;
  }

  updateBadges();
}

// Global Event Listeners
window.addEventListener('aura_cart_updated', updateBadges);
window.addEventListener('aura_wishlist_updated', updateBadges);

document.addEventListener('DOMContentLoaded', () => {
  renderHeaderAndFooter();
  initSearchModal();
});
