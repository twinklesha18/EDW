import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getApiError } from '../../services/api.js'
import { GUEST_WISHLIST_KEY, readStorage, removeStorage, writeStorage } from '../../utils/storage.js'
import { logoutUser, sessionExpired } from './authSlice.js'

const guestItems = () => readStorage(GUEST_WISHLIST_KEY).filter((item) => item?.productId)
const result = (items) => ({ items, count: items.length })
const rejectApi = (error, rejectWithValue) => rejectWithValue(getApiError(error))
export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => { try { return (await api.get('/wishlist')).data.data.wishlist } catch (error) { return rejectApi(error, rejectWithValue) } })
export const addToWishlist = createAsyncThunk('wishlist/add', async (payload, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) { try { return (await api.post('/wishlist/items', payload)).data.data.wishlist } catch (error) { return rejectApi(error, rejectWithValue) } }
  const items = guestItems(); if (!items.some((item) => item.productId === payload.productId)) items.push({ ...payload, _id: payload.productId })
  writeStorage(GUEST_WISHLIST_KEY, items); return result(items)
})
export const removeFromWishlist = createAsyncThunk('wishlist/remove', async (productId, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) { try { return (await api.delete(`/wishlist/items/${encodeURIComponent(productId)}`)).data.data.wishlist } catch (error) { return rejectApi(error, rejectWithValue) } }
  const items = guestItems().filter((item) => item.productId !== productId); writeStorage(GUEST_WISHLIST_KEY, items); return result(items)
})
export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (payload, apiTools) => {
  const exists = apiTools.getState().wishlist.items.some((item) => item.productId === payload.productId)
  return apiTools.dispatch(exists ? removeFromWishlist(payload.productId) : addToWishlist(payload)).unwrap()
})
export const clearWishlist = createAsyncThunk('wishlist/clear', async (_, { getState, rejectWithValue }) => {
  if (getState().auth.isAuthenticated) { try { return (await api.delete('/wishlist')).data.data.wishlist } catch (error) { return rejectApi(error, rejectWithValue) } }
  removeStorage(GUEST_WISHLIST_KEY); return result([])
})
export const syncGuestWishlist = createAsyncThunk('wishlist/sync', async (_, { getState, rejectWithValue }) => {
  if (!getState().auth.isAuthenticated) return result(guestItems())
  const items = guestItems().map(({ _id, ...item }) => item)
  try { const wishlist = items.length ? (await api.post('/wishlist/sync', { items })).data.data.wishlist : (await api.get('/wishlist')).data.data.wishlist; removeStorage(GUEST_WISHLIST_KEY); return wishlist } catch (error) { return rejectApi(error, rejectWithValue) }
}, { condition: (_, { getState }) => !getState().wishlist.isSyncing })

const initialState = { ...result(guestItems()), isLoading: false, isSyncing: false, error: null, pendingProductIds: [] }
const wishlistSlice = createSlice({ name: 'wishlist', initialState, reducers: { clearWishlistError: (state) => { state.error = null } }, extraReducers: (builder) => {
  const done = (state, action) => { Object.assign(state, action.payload); state.isLoading = false; state.isSyncing = false; state.error = null; state.pendingProductIds = [] }
  const fail = (state, action) => { state.isLoading = false; state.isSyncing = false; state.error = action.payload || { message: 'Unable to update your wishlist' }; state.pendingProductIds = [] }
  const load = (state) => { state.isLoading = true; state.error = null }
  builder.addCase(fetchWishlist.pending, load).addCase(fetchWishlist.fulfilled, done).addCase(fetchWishlist.rejected, fail)
    .addCase(addToWishlist.pending, (state, action) => { state.pendingProductIds.push(action.meta.arg.productId) }).addCase(addToWishlist.fulfilled, done).addCase(addToWishlist.rejected, fail)
    .addCase(removeFromWishlist.pending, (state, action) => { state.pendingProductIds.push(action.meta.arg) }).addCase(removeFromWishlist.fulfilled, done).addCase(removeFromWishlist.rejected, fail)
    .addCase(toggleWishlist.pending, (state, action) => { state.pendingProductIds.push(action.meta.arg.productId) }).addCase(toggleWishlist.fulfilled, done).addCase(toggleWishlist.rejected, fail)
    .addCase(clearWishlist.pending, load).addCase(clearWishlist.fulfilled, done).addCase(clearWishlist.rejected, fail)
    .addCase(syncGuestWishlist.pending, (state) => { state.isSyncing = true }).addCase(syncGuestWishlist.fulfilled, done).addCase(syncGuestWishlist.rejected, fail)
    .addCase(logoutUser.fulfilled, (state) => Object.assign(state, { ...result(guestItems()), isLoading: false, isSyncing: false, error: null, pendingProductIds: [] }))
    .addCase(sessionExpired, (state) => Object.assign(state, { ...result(guestItems()), isLoading: false, isSyncing: false, error: null, pendingProductIds: [] }))
} })
export const { clearWishlistError } = wishlistSlice.actions
export default wishlistSlice.reducer
