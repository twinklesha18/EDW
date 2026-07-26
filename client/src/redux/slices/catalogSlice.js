import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiError } from '../../services/api.js'
import { getStorefrontBootstrap } from '../../services/storefrontApi.js'
import { normalizeCatalogCategory, normalizeCatalogProduct } from '../../utils/catalogAdapters.js'

export const fetchCatalog = createAsyncThunk('catalog/fetch', async (_, { rejectWithValue }) => { try { const storefront = await getStorefrontBootstrap(); return { products: storefront.products.map(normalizeCatalogProduct), categories: storefront.categories.map(normalizeCatalogCategory), banners: storefront.banners, pagination: storefront.pagination } } catch (error) { return rejectWithValue(getApiError(error)) } }, { condition: (_, { getState }) => !getState().catalog.isLoading && !getState().catalog.loaded })

const catalogSlice = createSlice({ name: 'catalog', initialState: { products: [], categories: [], banners: [], pagination: null, isLoading: false, loaded: false, error: null }, reducers: { refreshCatalog: (state) => { state.loaded = false } }, extraReducers: (builder) => builder.addCase(fetchCatalog.pending, (state) => { state.isLoading = true; state.error = null }).addCase(fetchCatalog.fulfilled, (state, action) => { Object.assign(state, action.payload); state.isLoading = false; state.loaded = true }).addCase(fetchCatalog.rejected, (state, action) => { state.isLoading = false; state.loaded = true; state.error = action.payload }) })
export const { refreshCatalog } = catalogSlice.actions
export default catalogSlice.reducer
