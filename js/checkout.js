/* ==========================================================================
   AURA ATELIER - CART & CHECKOUT CONTROLLER
   ========================================================================== */

import { fetchProducts } from './products-data.js';
import { Store } from './store.js';
import { showToast } from './main.js';

let appliedDiscount = 0; // 0 to 0.20
let selectedShippingCost = 0; // 0 for white-glove over threshold or flat rate

// CART PAGE LOGIC
export async function initCartPage() {
  const container = document.getElementById('cart-items-container');
  if (!container) return; // Not on cart page

  const products = await fetchProducts();
  const cart = Store.getCart();

  if (cart.length === 0) {
    renderEmptyCart();
    return;
  }

  renderCartItems(cart, products);
  setupCartControls();
  recalculateOrderSummary(cart, products);
}

function renderEmptyCart() {
  const cartLayout = document.getElementById('cart-workspace');
  if (!cartLayout) return;

  cartLayout.innerHTML = `
    <div class="glass-panel-dark" style="text-align: center; padding: 5rem 2rem; width: 100%;">
      <i class="fas fa-shopping-bag text-gold" style="font-size: 3.5rem; margin-bottom: 1.5rem;"></i>
      <h2 style="color: #FFF; font-family: var(--font-heading); margin-bottom: 0.75rem;">Your Luxury Bag is Currently Empty</h2>
      <p style="color: var(--text-light-muted); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">Explore our curated taxonomy of Italian marble tables, velvet lounges, and sculptural lighting.</p>
      <a href="shop.html" class="btn btn-gold">Discover Atelier Catalog &rarr;</a>
    </div>
  `;
}

function renderCartItems(cart, products) {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  container.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';

    const itemTotal = p.price * item.quantity;

    return `
      <div class="glass-card-gold" style="display: flex; gap: 1.5rem; padding: 1.25rem; align-items: center; margin-bottom: 1.25rem;">
        <img src="${p.image}" alt="${p.name}" style="width: 100px; height: 100px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-gold);">
        <div style="flex-grow: 1;">
          <span style="color: var(--gold-primary); font-size: 0.75rem; text-transform: uppercase;">${p.category}</span>
          <h4 style="font-family: var(--font-heading); color: #FFF; font-size: 1.05rem; margin: 0.25rem 0;"><a href="product.html?id=${p.id}">${p.name}</a></h4>
          <span style="color: var(--text-light-muted); font-size: 0.85rem;">Unit Price: $${p.price.toLocaleString()}</span>
        </div>
        <div style="display: flex; align-items: center; border: 1px solid var(--border-gold); border-radius: 4px; overflow: hidden;">
          <button class="cart-qty-btn" data-id="${p.id}" data-action="minus" style="padding: 0.5rem 0.8rem; color: #FFF;">-</button>
          <span style="width: 40px; text-align: center; color: #FFF; font-weight: 700; font-size: 0.95rem;">${item.quantity}</span>
          <button class="cart-qty-btn" data-id="${p.id}" data-action="plus" style="padding: 0.5rem 0.8rem; color: #FFF;">+</button>
        </div>
        <div style="text-align: right; min-width: 110px;">
          <span style="font-size: 1.25rem; font-weight: 800; color: var(--gold-primary);">$${itemTotal.toLocaleString()}</span>
        </div>
        <button class="cart-remove-btn" data-id="${p.id}" style="color: #E53E3E; background: transparent; font-size: 1.1rem; cursor: pointer; padding: 0.5rem;" title="Remove Item">
          <i class="fas fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join('');

  // Attach quantity & remove events
  container.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const currentItem = cart.find(i => i.id === id);
      if (!currentItem) return;

      const newQty = action === 'plus' ? currentItem.quantity + 1 : currentItem.quantity - 1;
      Store.updateCartQuantity(id, newQty);
      initCartPage();
    };
  });

  container.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      Store.removeFromCart(id);
      showToast('Item removed from cart');
      initCartPage();
    };
  });
}

function setupCartControls() {
  // Coupon Code
  const couponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');
  if (couponBtn && couponInput) {
    couponBtn.onclick = async () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'LUXE20' || code === 'LUXE2026') {
        appliedDiscount = 0.20;
        showToast('20% Exclusive Atelier Discount Applied!');
      } else if (code === 'ATELIER10') {
        appliedDiscount = 0.10;
        showToast('10% VIP Discount Applied!');
      } else {
        showToast('Invalid Coupon Code', '✕');
        appliedDiscount = 0;
      }
      const cart = Store.getCart();
      const products = await fetchProducts();
      recalculateOrderSummary(cart, products);
    };
  }

  // Shipping selector
  const shippingSelect = document.getElementById('shipping-method-select');
  if (shippingSelect) {
    shippingSelect.onchange = async (e) => {
      selectedShippingCost = Number(e.target.value);
      const cart = Store.getCart();
      const products = await fetchProducts();
      recalculateOrderSummary(cart, products);
    };
  }
}

function recalculateOrderSummary(cart, products) {
  let subtotal = 0;
  cart.forEach(item => {
    const p = products.find(prod => prod.id === item.id);
    if (p) subtotal += p.price * item.quantity;
  });

  // White glove free threshold over $2500
  let shipping = selectedShippingCost;
  if (subtotal >= 2500 && selectedShippingCost === 0) {
    shipping = 0; // Complimentary
  } else if (subtotal < 2500 && selectedShippingCost === 0) {
    shipping = 180; // Standard white-glove for under 2500
  }

  const discountAmount = subtotal * appliedDiscount;
  const tax = (subtotal - discountAmount) * 0.08;
  const grandTotal = subtotal - discountAmount + shipping + tax;

  const subElem = document.getElementById('summary-subtotal');
  const discElem = document.getElementById('summary-discount');
  const shipElem = document.getElementById('summary-shipping');
  const taxElem = document.getElementById('summary-tax');
  const totalElem = document.getElementById('summary-total');

  if (subElem) subElem.textContent = `$${subtotal.toLocaleString()}`;
  if (discElem) discElem.textContent = `-$${discountAmount.toLocaleString()}`;
  if (shipElem) shipElem.textContent = shipping === 0 ? 'COMPLIMENTARY' : `$${shipping.toLocaleString()}`;
  if (taxElem) taxElem.textContent = `$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (totalElem) totalElem.textContent = `$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return { subtotal, discountAmount, shipping, tax, grandTotal };
}

// CHECKOUT PAGE LOGIC
export async function initCheckoutPage() {
  const checkoutContainer = document.getElementById('checkout-workspace');
  if (!checkoutContainer) return; // Not on checkout page

  const products = await fetchProducts();
  const cart = Store.getCart();

  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  renderCheckoutSummary(cart, products);
  setupVirtualCardPreview();
  setupPaymentTabs();
  setupOrderPlacement(cart);
}

function renderCheckoutSummary(cart, products) {
  const listContainer = document.getElementById('checkout-items-list');
  if (!listContainer) return;

  let subtotal = 0;
  listContainer.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';
    const itemSub = p.price * item.quantity;
    subtotal += itemSub;

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${p.image}" alt="${p.name}" style="width: 45px; height: 45px; border-radius: 4px; object-fit: cover;">
          <div>
            <h5 style="color: #FFF; font-size: 0.85rem;">${p.name}</h5>
            <span style="color: var(--text-light-muted); font-size: 0.75rem;">Qty: ${item.quantity}</span>
          </div>
        </div>
        <span style="color: var(--gold-primary); font-weight: 700; font-size: 0.9rem;">$${itemSub.toLocaleString()}</span>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const totalElem = document.getElementById('checkout-grand-total');
  if (totalElem) totalElem.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function setupVirtualCardPreview() {
  const cardNumInput = document.getElementById('card-number-input');
  const cardNameInput = document.getElementById('card-name-input');
  const cardExpInput = document.getElementById('card-exp-input');

  const cardNumDisplay = document.getElementById('card-preview-number');
  const cardNameDisplay = document.getElementById('card-preview-name');
  const cardExpDisplay = document.getElementById('card-preview-exp');

  if (cardNumInput && cardNumDisplay) {
    cardNumInput.oninput = (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || '•••• •••• •••• ••••';
      cardNumDisplay.textContent = val;
    };
  }

  if (cardNameInput && cardNameDisplay) {
    cardNameInput.oninput = (e) => {
      cardNameDisplay.textContent = e.target.value.toUpperCase() || 'CLIENT NAME';
    };
  }

  if (cardExpInput && cardExpDisplay) {
    cardExpInput.oninput = (e) => {
      cardExpDisplay.textContent = e.target.value || 'MM/YY';
    };
  }
}

function setupPaymentTabs() {
  const tabs = document.querySelectorAll('.payment-tab-btn');
  const panels = document.querySelectorAll('.payment-panel');

  tabs.forEach(tab => {
    tab.onclick = () => {
      const target = tab.dataset.payment;
      tabs.forEach(t => {
        t.classList.remove('btn-gold');
        t.classList.add('btn-glass');
      });
      tab.classList.add('btn-gold');
      tab.classList.remove('btn-glass');

      panels.forEach(p => {
        if (p.id === `payment-${target}`) p.style.display = 'block';
        else p.style.display = 'none';
      });
    };
  });
}

function setupOrderPlacement(cart) {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.onsubmit = (e) => {
    e.preventDefault();

    const orderId = `AURA-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let modal = document.getElementById('order-success-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'order-success-modal';
      modal.className = 'glass-modal-backdrop active';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-modal-content" style="max-width: 600px; text-align: center; padding: 3.5rem;">
        <i class="fas fa-circle-check text-gold" style="font-size: 4rem; margin-bottom: 1.5rem;"></i>
        <span class="section-subtitle">ORDER CONFIRMED</span>
        <h2 style="font-family: var(--font-heading); color: #FFF; font-size: 2rem; margin: 0.5rem 0 1rem 0;">THANK YOU FOR YOUR LUXURY PURCHASE</h2>
        <p style="color: var(--text-light-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">
          Your order reference is <strong style="color: var(--gold-primary);">${orderId}</strong>. Our private white-glove concierge will contact you within 24 hours to schedule white-glove delivery.
        </p>
        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-gold); margin-bottom: 2rem; font-size: 0.85rem; color: var(--text-light-muted);">
          Confirmation invoice sent to your email.
        </div>
        <a href="index.html" class="btn btn-gold" id="finish-order-btn">Return to Atelier Salon &rarr;</a>
      </div>
    `;

    document.getElementById('finish-order-btn').onclick = () => {
      Store.clearCart();
    };

    Store.clearCart();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initCartPage();
  initCheckoutPage();
});
