import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getApiError } from '../../services/api.js'
import { normalizeCatalogCategory, normalizeCatalogProduct } from '../../utils/catalogAdapters.js'

export const fetchCatalog = createAsyncThunk('catalog/fetch', async (_, { rejectWithValue }) => { try { const [productsResponse, categoriesResponse, bannersResponse] = await Promise.all([api.get('/products', { params: { limit: 100, sort: 'featured' } }), api.get('/categories'), api.get('/banners')]); return { products: productsResponse.data.data.products.map(normalizeCatalogProduct), categories: categoriesResponse.data.data.categories.map(normalizeCatalogCategory), banners: bannersResponse.data.data.banners, pagination: productsResponse.data.data.pagination } } catch (error) { return rejectWithValue(getApiError(error)) } }, { condition: (_, { getState }) => !getState().catalog.isLoading && !getState().catalog.loaded })

const catalogSlice = createSlice({ name: 'catalog', initialState: { products: [], categories: [], banners: [], pagination: null, isLoading: false, loaded: false, error: null }, reducers: { refreshCatalog: (state) => { state.loaded = false } }, extraReducers: (builder) => builder.addCase(fetchCatalog.pending, (state) => { state.isLoading = true; state.error = null }).addCase(fetchCatalog.fulfilled, (state, action) => { Object.assign(state, action.payload); state.isLoading = false; state.loaded = true }).addCase(fetchCatalog.rejected, (state, action) => { state.isLoading = false; state.loaded = true; state.error = action.payload }) })
export const { refreshCatalog } = catalogSlice.actions
export default catalogSlice.reducer
