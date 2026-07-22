import assert from 'node:assert/strict'

const values = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  },
  dispatchEvent: () => true,
}

const { configureStore } = await import('@reduxjs/toolkit')
const { default: authReducer } = await import('../src/redux/slices/authSlice.js')
const cart = await import('../src/redux/slices/cartSlice.js')
const wishlist = await import('../src/redux/slices/wishlistSlice.js')

const store = configureStore({ reducer: { auth: authReducer, cart: cart.default, wishlist: wishlist.default } })
const item = (message = '') => ({ productId: 'prod-001', name: 'Pink Chocolate Delight Bouquet', slug: 'pink-chocolate-delight-bouquet', image: '/gift.jpg', size: 'S', price: 8950, quantity: 1, category: 'Chocolate Bouquets', customization: { message, preferredColor: '', notes: '' } })
const wish = { productId: 'prod-001', name: 'Pink Chocolate Delight Bouquet', slug: 'pink-chocolate-delight-bouquet', image: '/gift.jpg', price: 8950, category: 'Chocolate Bouquets' }

await store.dispatch(cart.addToCart(item())).unwrap()
await store.dispatch(cart.addToCart(item())).unwrap()
assert.equal(store.getState().cart.items.length, 1, 'Identical guest cart items must merge')
assert.equal(store.getState().cart.itemCount, 2, 'Guest item count must total quantities')
assert.equal(store.getState().cart.subtotal, 17900, 'Guest subtotal must be calculated')

await store.dispatch(cart.addToCart(item('Happy birthday'))).unwrap()
assert.equal(store.getState().cart.items.length, 2, 'Different customization must create a unique row')
assert.equal(JSON.parse(values.get('edw_guest_cart')).length, 2, 'Guest cart must persist')
const firstCartId = store.getState().cart.items[0]._id
await store.dispatch(cart.updateCartQuantity({ itemId: firstCartId, quantity: 3 })).unwrap()
assert.equal(store.getState().cart.itemCount, 4, 'Guest quantity update must work')
await assert.rejects(store.dispatch(cart.updateCartQuantity({ itemId: firstCartId, quantity: 100 })).unwrap(), 'Guest quantity limits must reject')
await store.dispatch(cart.removeCartItem(firstCartId)).unwrap()
assert.equal(store.getState().cart.items.length, 1, 'Guest cart removal must work')

await store.dispatch(wishlist.addToWishlist(wish)).unwrap()
await store.dispatch(wishlist.addToWishlist(wish)).unwrap()
assert.equal(store.getState().wishlist.count, 1, 'Guest wishlist must prevent duplicates')
assert.equal(JSON.parse(values.get('edw_guest_wishlist')).length, 1, 'Guest wishlist must persist')
await store.dispatch(wishlist.toggleWishlist(wish)).unwrap()
assert.equal(store.getState().wishlist.count, 0, 'Guest wishlist toggle must remove an existing item')

await store.dispatch(cart.clearCart()).unwrap()
await store.dispatch(wishlist.clearWishlist()).unwrap()
assert.equal(store.getState().cart.itemCount, 0)
assert.equal(store.getState().wishlist.count, 0)
console.log('Phase 3 client state smoke test passed: guest persistence, merging, customization, totals, quantity limits, removal and wishlist behavior.')
