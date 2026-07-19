/* ==========================================================================
   AURA ATELIER - LOCALSTORAGE STATE STORE
   ========================================================================== */

const CART_KEY = 'aura_atelier_cart';
const WISHLIST_KEY = 'aura_atelier_wishlist';

export const Store = {
  // CART OPERATIONS
  getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart state:', e);
      return [];
    }
  },

  addToCart(productId, quantity = 1, options = {}) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: productId,
        quantity: quantity,
        addedAt: new Date().toISOString(),
        ...options
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('aura_cart_updated', { detail: { cart } }));
    return true;
  },

  updateCartQuantity(productId, quantity) {
    let cart = this.getCart();
    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
      cart[index].quantity = quantity;
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('aura_cart_updated', { detail: { cart } }));
    }
    return cart;
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('aura_cart_updated', { detail: { cart } }));
    return cart;
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent('aura_cart_updated', { detail: { cart: [] } }));
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  // WISHLIST OPERATIONS
  getWishlist() {
    try {
      const data = localStorage.getItem(WISHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading wishlist:', e);
      return [];
    }
  },

  toggleWishlist(productId) {
    let wishlist = this.getWishlist();
    const index = wishlist.indexOf(productId);
    let added = false;

    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(productId);
      added = true;
    }

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent('aura_wishlist_updated', { detail: { wishlist, productId, added } }));
    return added;
  },

  isInWishlist(productId) {
    const wishlist = this.getWishlist();
    return wishlist.includes(productId);
  },

  getWishlistCount() {
    return this.getWishlist().length;
  },

  clearWishlist() {
    localStorage.removeItem(WISHLIST_KEY);
    window.dispatchEvent(new CustomEvent('aura_wishlist_updated', { detail: { wishlist: [] } }));
  }
};

// Make Store globally available for standard non-module scripts if needed
window.AuraStore = Store;
