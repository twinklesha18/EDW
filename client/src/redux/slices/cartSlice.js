import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getApiError } from '../../services/api.js'
import { createGuestSignature } from '../../utils/productAdapters.js'
import { GUEST_CART_KEY, readStorage, removeStorage, writeStorage } from '../../utils/storage.js'
import { logoutUser, sessionExpired } from './authSlice.js'

const summarize = (items) => ({ items, itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) })
const guestItems = () => readStorage(GUEST_CART_KEY).filter((item) => item?.productId && item.quantity > 0)
const rejectApi = (error, rejectWithValue) => rejectWithValue(getApiError(error))

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/cart')).data.data.cart } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const addToCart = createAsyncThunk('cart/add', async (payload, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) {
    try { return (await api.post('/cart/items', payload)).data.data.cart } catch (error) { return rejectApi(error, rejectWithValue) }
  }
  const items = guestItems()
  const signature = createGuestSignature(payload.productId, payload.size, payload.customization)
  const existing = items.find((item) => item.signature === signature)
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + payload.quantity)
  } else items.push({ ...payload, _id: signature, signature })
  writeStorage(GUEST_CART_KEY, items)
  return summarize(items)
})

export const updateCartQuantity = createAsyncThunk('cart/update', async ({ itemId, quantity }, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) {
    try { return (await api.put(`/cart/items/${itemId}`, { quantity })).data.data.cart } catch (error) { return rejectApi(error, rejectWithValue) }
  }
  const items = guestItems()
  const item = items.find((entry) => entry._id === itemId)
  if (!item) return rejectWithValue({ message: 'Cart item not found' })
  const next = quantity < 1 ? items.filter((entry) => entry._id !== itemId) : items.map((entry) => entry._id === itemId ? { ...entry, quantity } : entry)
  writeStorage(GUEST_CART_KEY, next)
  return summarize(next)
})

export const removeCartItem = createAsyncThunk('cart/remove', async (itemId, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) {
    try { return (await api.delete(`/cart/items/${itemId}`)).data.data.cart } catch (error) { return rejectApi(error, rejectWithValue) }
  }
  const next = guestItems().filter((item) => item._id !== itemId)
  writeStorage(GUEST_CART_KEY, next)
  return summarize(next)
})

export const clearCart = createAsyncThunk('cart/clear', async (_, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) {
    try { return (await api.delete('/cart')).data.data.cart } catch (error) { return rejectApi(error, rejectWithValue) }
  }
  removeStorage(GUEST_CART_KEY)
  return summarize([])
})

export const syncGuestCart = createAsyncThunk('cart/sync', async (_, { getState, rejectWithValue }) => {
  if (!getState().auth.isAuthenticated) return summarize(guestItems())
  const items = guestItems().map(({ _id, signature: _signature, ...item }) => item)
  try {
    const cart = items.length ? (await api.post('/cart/sync', { items })).data.data.cart : (await api.get('/cart')).data.data.cart
    removeStorage(GUEST_CART_KEY)
    return cart
  } catch (error) { return rejectApi(error, rejectWithValue) }
}, { condition: (_, { getState }) => !getState().cart.isSyncing })

const stored = summarize(guestItems())
const initialState = { ...stored, isLoading: false, isSyncing: false, error: null, isCartOpen: false, pendingProductIds: [] }
const cartSlice = createSlice({
  name: 'cart', initialState,
  reducers: {
    toggleCartDrawer: (state, action) => { state.isCartOpen = typeof action.payload === 'boolean' ? action.payload : !state.isCartOpen },
    clearCartError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    const fulfilled = (state, action) => { Object.assign(state, action.payload); state.isLoading = false; state.isSyncing = false; state.error = null; state.pendingProductIds = [] }
    const failed = (state, action) => { state.isLoading = false; state.isSyncing = false; state.error = action.payload || { message: 'Unable to update your cart' }; state.pendingProductIds = [] }
    const pending = (state) => { state.isLoading = true; state.error = null }
    builder
      .addCase(fetchCart.pending, pending).addCase(fetchCart.fulfilled, fulfilled).addCase(fetchCart.rejected, failed)
      .addCase(addToCart.pending, (state, action) => { state.pendingProductIds.push(action.meta.arg.productId); state.error = null }).addCase(addToCart.fulfilled, fulfilled).addCase(addToCart.rejected, failed)
      .addCase(updateCartQuantity.pending, pending).addCase(updateCartQuantity.fulfilled, fulfilled).addCase(updateCartQuantity.rejected, failed)
      .addCase(removeCartItem.pending, pending).addCase(removeCartItem.fulfilled, fulfilled).addCase(removeCartItem.rejected, failed)
      .addCase(clearCart.pending, pending).addCase(clearCart.fulfilled, fulfilled).addCase(clearCart.rejected, failed)
      .addCase(syncGuestCart.pending, (state) => { state.isSyncing = true }).addCase(syncGuestCart.fulfilled, fulfilled).addCase(syncGuestCart.rejected, failed)
      .addCase(logoutUser.fulfilled, (state) => Object.assign(state, { ...summarize(guestItems()), isLoading: false, isSyncing: false, error: null, pendingProductIds: [] }))
      .addCase(sessionExpired, (state) => Object.assign(state, { ...summarize(guestItems()), isLoading: false, isSyncing: false, error: null, pendingProductIds: [] }))
  },
})
export const { toggleCartDrawer, clearCartError } = cartSlice.actions
export default cartSlice.reducer
