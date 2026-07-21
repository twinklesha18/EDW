export const GUEST_CART_KEY = 'edw_guest_cart'
export const GUEST_WISHLIST_KEY = 'edw_guest_wishlist'

export function readStorage(key, fallback = []) {
  if (typeof window === 'undefined') return fallback
  try {
    const value = JSON.parse(window.localStorage.getItem(key))
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage can be unavailable in private contexts. */ }
}

export function removeStorage(key) {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(key) } catch { /* Storage can be unavailable in private contexts. */ }
}
