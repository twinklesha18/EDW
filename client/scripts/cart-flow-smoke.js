import assert from 'node:assert/strict'
import { createGuestSignature, hasCartConfiguration } from '../src/utils/productAdapters.js'

const existing = {
  productId: 'product-1',
  size: 'M',
  quantity: 1,
  customization: {
    message: 'Happy Birthday',
    preferredColor: 'Pink',
    notes: 'Add a ribbon',
  },
}

assert.equal(
  hasCartConfiguration([existing], {
    ...existing,
    quantity: 3,
    customization: {
      message: '  happy birthday ',
      preferredColor: 'PINK',
      notes: 'add a ribbon',
    },
  }),
  true,
  'The same product configuration must be recognized regardless of quantity, casing, or outer whitespace.',
)

assert.equal(hasCartConfiguration([existing], { ...existing, size: 'L' }), false, 'A different size must remain a separate cart line.')
assert.equal(
  hasCartConfiguration([existing], { ...existing, customization: { ...existing.customization, message: 'Congratulations' } }),
  false,
  'A different customization must remain a separate cart line.',
)
assert.equal(
  createGuestSignature(existing.productId, existing.size, existing.customization),
  createGuestSignature(existing.productId, existing.size, {
    message: ' happy birthday ',
    preferredColor: 'pink',
    notes: 'ADD A RIBBON',
  }),
  'Guest cart signatures must be normalized consistently.',
)

console.log('Cart flow smoke test passed: Buy Now matching is configuration-aware and quantity-independent.')
