/* ==========================================================================
   AURA ATELIER - PRODUCT DETAIL CONTROLLER
   ========================================================================== */

import { getProductById, getProductsByCategory, fetchProducts } from './products-data.js';
import { Store } from './store.js';
import { showToast } from './main.js';

let currentProduct = null;
let currentQuantity = 1;

export async function initProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id') || '1';

  currentProduct = await getProductById(idParam);
  if (!currentProduct) {
    currentProduct = await getProductById(1);
  }

  renderProductDetails();
  setupGalleryAndZoom();
  setupTabs();
  renderFrequentlyBought();
  renderRelatedProducts();
}

function renderProductDetails() {
  document.title = `${currentProduct.name} | AURA Atelier`;

  // Breadcrumbs
  const bCat = document.getElementById('pd-bc-cat');
  const bTitle = document.getElementById('pd-bc-title');
  if (bCat) bCat.textContent = currentProduct.category;
  if (bTitle) bTitle.textContent = currentProduct.name;

  // Title, Category, Badges
  const catTag = document.getElementById('pd-category');
  const titleElem = document.getElementById('pd-title');
  const priceElem = document.getElementById('pd-price');
  const origPriceElem = document.getElementById('pd-original-price');
  const discElem = document.getElementById('pd-discount');
  const descElem = document.getElementById('pd-description');
  const ratingElem = document.getElementById('pd-rating');
  const reviewCountElem = document.getElementById('pd-review-count');

  if (catTag) catTag.textContent = currentProduct.category;
  if (titleElem) titleElem.textContent = currentProduct.name;
  if (priceElem) priceElem.textContent = `$${currentProduct.price.toLocaleString()}`;
  
  if (origPriceElem) {
    if (currentProduct.originalPrice) {
      origPriceElem.textContent = `$${currentProduct.originalPrice.toLocaleString()}`;
      origPriceElem.style.display = 'inline';
    } else {
      origPriceElem.style.display = 'none';
    }
  }

  if (discElem) {
    if (currentProduct.discount) {
      discElem.textContent = `-${currentProduct.discount}% OFF`;
      discElem.style.display = 'inline-block';
    } else {
      discElem.style.display = 'none';
    }
  }

  if (descElem) descElem.textContent = currentProduct.shortDescription;
  if (ratingElem) ratingElem.innerHTML = `<i class="fas fa-star text-gold"></i> ${currentProduct.rating}`;
  if (reviewCountElem) reviewCountElem.textContent = `(${currentProduct.reviewCount} Client Reviews)`;

  // Quantity Actions
  const qtyInput = document.getElementById('pd-qty-input');
  const qtyMinus = document.getElementById('pd-qty-minus');
  const qtyPlus = document.getElementById('pd-qty-plus');

  if (qtyMinus) qtyMinus.onclick = () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      if (qtyInput) qtyInput.value = currentQuantity;
    }
  };
  if (qtyPlus) qtyPlus.onclick = () => {
    currentQuantity++;
    if (qtyInput) qtyInput.value = currentQuantity;
  };
  if (qtyInput) qtyInput.onchange = (e) => {
    currentQuantity = Math.max(1, Number(e.target.value) || 1);
  };

  // Add to Cart
  const addCartBtn = document.getElementById('pd-add-cart-btn');
  if (addCartBtn) addCartBtn.onclick = () => {
    Store.addToCart(currentProduct.id, currentQuantity);
    showToast(`Added ${currentQuantity}x "${currentProduct.name}" to your luxury bag!`);
  };

  // Buy Now
  const buyNowBtn = document.getElementById('pd-buy-now-btn');
  if (buyNowBtn) buyNowBtn.onclick = () => {
    Store.addToCart(currentProduct.id, currentQuantity);
    window.location.href = 'checkout.html';
  };

  // Wishlist toggle
  const wishBtn = document.getElementById('pd-wishlist-btn');
  if (wishBtn) {
    const updateWishIcon = () => {
      const inWish = Store.isInWishlist(currentProduct.id);
      wishBtn.innerHTML = `<i class="fa${inWish ? 's' : 'r'} fa-heart"></i> ${inWish ? 'Saved in Wishlist' : 'Add to Wishlist'}`;
      if (inWish) wishBtn.classList.add('btn-gold');
      else wishBtn.classList.remove('btn-gold');
    };
    updateWishIcon();

    wishBtn.onclick = () => {
      const added = Store.toggleWishlist(currentProduct.id);
      showToast(added ? 'Saved to Wishlist!' : 'Removed from Wishlist');
      updateWishIcon();
    };
  }

  // Populate Specifications Table
  const specsTable = document.getElementById('pd-specs-table');
  if (specsTable && currentProduct.specifications) {
    specsTable.innerHTML = Object.entries(currentProduct.specifications).map(([key, val]) => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 1rem 0; color: var(--gold-primary); font-weight: 600; width: 35%;">${key}</td>
        <td style="padding: 1rem 0; color: var(--text-light-secondary);">${val}</td>
      </tr>
    `).join('');
  }

  // Populate Full Description Tab
  const fullDescElem = document.getElementById('pd-full-description');
  if (fullDescElem) fullDescElem.textContent = currentProduct.fullDescription || currentProduct.shortDescription;

  // Populate Reviews Tab
  renderReviews();
}

function setupGalleryAndZoom() {
  const mainImg = document.getElementById('pd-main-img');
  const mainImgWrap = document.getElementById('pd-img-container');
  const thumbsContainer = document.getElementById('pd-thumbs-container');

  if (!mainImg || !currentProduct) return;

  mainImg.src = currentProduct.image;
  mainImg.alt = currentProduct.name;

  const gallery = currentProduct.gallery || [currentProduct.image];
  if (thumbsContainer) {
    thumbsContainer.innerHTML = gallery.map((imgUrl, idx) => `
      <div class="pd-thumb ${idx === 0 ? 'active' : ''}" style="width: 80px; height: 80px; border-radius: 6px; overflow: hidden; cursor: pointer; border: 1px solid ${idx === 0 ? 'var(--gold-primary)' : 'rgba(255,255,255,0.2)'};">
        <img src="${imgUrl}" alt="Thumbnail ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    `).join('');

    thumbsContainer.querySelectorAll('.pd-thumb').forEach((thumb, i) => {
      thumb.onclick = () => {
        thumbsContainer.querySelectorAll('.pd-thumb').forEach(t => t.style.borderColor = 'rgba(255,255,255,0.2)');
        thumb.style.borderColor = 'var(--gold-primary)';
        mainImg.src = gallery[i];
      };
    });
  }

  // Lens Hover Zoom Effect
  if (mainImgWrap) {
    mainImgWrap.onmousemove = (e) => {
      const { left, top, width, height } = mainImgWrap.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transform = 'scale(1.75)';
    };

    mainImgWrap.onmouseleave = () => {
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    };
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.pd-tab-btn');
  const tabContents = document.querySelectorAll('.pd-tab-content');

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const tabTarget = btn.dataset.tab;

      tabBtns.forEach(b => {
        b.classList.remove('btn-gold');
        b.classList.add('btn-glass');
      });
      btn.classList.add('btn-gold');
      btn.classList.remove('btn-glass');

      tabContents.forEach(c => {
        if (c.id === `tab-${tabTarget}`) {
          c.style.display = 'block';
        } else {
          c.style.display = 'none';
        }
      });
    };
  });
}

function renderReviews() {
  const reviewsContainer = document.getElementById('pd-reviews-list');
  if (!reviewsContainer) return;

  const reviews = currentProduct.reviews || [];
  if (reviews.length === 0) {
    reviewsContainer.innerHTML = `
      <p style="color: var(--text-light-muted); font-size: 0.9rem;">Be the first client to review this bespoke piece.</p>
    `;
    return;
  }

  reviewsContainer.innerHTML = reviews.map(r => `
    <div class="glass-panel-dark" style="padding: 1.5rem; margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h4 style="color: #FFF; font-size: 1rem; font-family: var(--font-heading);">${r.author}</h4>
        <span style="color: var(--text-light-muted); font-size: 0.75rem;">${r.date}</span>
      </div>
      <div class="stars" style="margin-bottom: 0.5rem;">
        ${Array(r.rating).fill('<i class="fas fa-star"></i>').join('')}
      </div>
      <h5 style="color: var(--gold-primary); font-size: 0.95rem; margin-bottom: 0.5rem;">${r.title}</h5>
      <p style="color: var(--text-light-secondary); font-size: 0.875rem;">${r.comment}</p>
    </div>
  `).join('');
}

async function renderFrequentlyBought() {
  const container = document.getElementById('pd-bundle-container');
  if (!container || !currentProduct.frequentlyBoughtTogether) return;

  const bundleIds = currentProduct.frequentlyBoughtTogether;
  const allProds = await fetchProducts();
  const bundleItems = [currentProduct, ...allProds.filter(p => bundleIds.includes(p.id))];

  const totalBundlePrice = bundleItems.reduce((sum, item) => sum + item.price, 0);

  container.innerHTML = `
    <div class="glass-card-gold" style="padding: 2rem; margin-top: 3rem;">
      <h3 style="font-family: var(--font-heading); color: #FFF; font-size: 1.25rem; margin-bottom: 1.5rem;"><i class="fas fa-layer-group text-gold"></i> FREQUENTLY BOUGHT TOGETHER</h3>
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        ${bundleItems.map((item, idx) => `
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-gold);">
            <div>
              <h5 style="color: #FFF; font-size: 0.85rem; max-width: 180px;">${item.name}</h5>
              <span style="color: var(--gold-primary); font-weight: 700; font-size: 0.9rem;">$${item.price.toLocaleString()}</span>
            </div>
          </div>
          ${idx < bundleItems.length - 1 ? '<span style="color: var(--gold-primary); font-size: 1.5rem; font-weight: 700;">+</span>' : ''}
        `).join('')}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
        <div>
          <span style="color: var(--text-light-muted); font-size: 0.85rem;">Total Bundle Price: </span>
          <span style="color: var(--gold-primary); font-size: 1.4rem; font-weight: 800;">$${totalBundlePrice.toLocaleString()}</span>
        </div>
        <button id="add-bundle-btn" class="btn btn-gold">Add Bundle To Cart &rarr;</button>
      </div>
    </div>
  `;

  const addBundleBtn = document.getElementById('add-bundle-btn');
  if (addBundleBtn) {
    addBundleBtn.onclick = () => {
      bundleItems.forEach(item => Store.addToCart(item.id, 1));
      showToast(`Added full 3-piece Atelier bundle to cart!`);
    };
  }
}

async function renderRelatedProducts() {
  const container = document.getElementById('pd-related-grid');
  if (!container || !currentProduct) return;

  const categoryProducts = await getProductsByCategory(currentProduct.category);
  const related = categoryProducts.filter(p => p.id !== currentProduct.id).slice(0, 4);

  if (related.length === 0) return;

  container.innerHTML = related.map(p => `
    <div class="product-card">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" class="product-img product-img-main" loading="lazy">
        <img src="${p.hoverImage || p.image}" alt="${p.name}" class="product-img product-img-hover" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="price-row">
          <span class="current-price">$${p.price.toLocaleString()}</span>
        </div>
        <button class="btn btn-gold add-cart-btn-card" onclick="Store.addToCart(${p.id}, 1); showToast('Added to bag!');">Add To Cart</button>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initProductDetail);
