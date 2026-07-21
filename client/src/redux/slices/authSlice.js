import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getApiError } from '../../services/api.js'

const rejectApi = (error, rejectWithValue) => rejectWithValue(getApiError(error))

export const registerUser = createAsyncThunk('auth/register', async (values, { rejectWithValue }) => {
  try { return (await api.post('/auth/register', values)).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const loginUser = createAsyncThunk('auth/login', async (values, { rejectWithValue }) => {
  try { return (await api.post('/auth/login', values)).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const resetUserPassword = createAsyncThunk('auth/resetPassword', async ({ token, values }, { rejectWithValue }) => {
  try { return (await api.post(`/auth/reset-password/${token}`, values)).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try { await api.post('/auth/logout') } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const getCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return (await api.get('/auth/me')).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
}, { condition: (_, { getState }) => !getState().auth.isLoading && !getState().auth.authChecked })

const userRequest = (type, method, url) => createAsyncThunk(type, async (values, { rejectWithValue }) => {
  try { return (await api[method](url(values), values?.body ?? values)).data.data?.user } catch (error) { return rejectApi(error, rejectWithValue) }
})

export const updateProfile = userRequest('auth/updateProfile', 'put', () => '/users/profile')
export const changePassword = createAsyncThunk('auth/changePassword', async (values, { rejectWithValue }) => {
  try { return (await api.put('/users/change-password', values)).data.message } catch (error) { return rejectApi(error, rejectWithValue) }
})
export const addAddress = userRequest('auth/addAddress', 'post', () => '/users/addresses')
export const updateAddress = userRequest('auth/updateAddress', 'put', ({ addressId }) => `/users/addresses/${addressId}`)
export const deleteAddress = createAsyncThunk('auth/deleteAddress', async (addressId, { rejectWithValue }) => {
  try { return (await api.delete(`/users/addresses/${addressId}`)).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
})
export const setDefaultAddress = createAsyncThunk('auth/setDefaultAddress', async (addressId, { rejectWithValue }) => {
  try { return (await api.put(`/users/addresses/${addressId}/default`)).data.data.user } catch (error) { return rejectApi(error, rejectWithValue) }
})

const initialState = { user: null, isAuthenticated: false, isLoading: false, authChecked: false, error: null }

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    clearAuthError: (state) => { state.error = null },
    sessionExpired: (state) => { Object.assign(state, { ...initialState, authChecked: true }) },
  },
  extraReducers: (builder) => {
    const authSuccess = (state, action) => { state.user = action.payload; state.isAuthenticated = true; state.isLoading = false; state.authChecked = true; state.error = null }
    const userSuccess = (state, action) => { state.user = action.payload; state.isLoading = false; state.error = null }
    const pending = (state) => { state.isLoading = true; state.error = null }
    const failed = (state, action) => { state.isLoading = false; state.error = action.payload || { message: 'Something went wrong' } }
    builder
      .addCase(registerUser.pending, pending).addCase(registerUser.fulfilled, authSuccess).addCase(registerUser.rejected, failed)
      .addCase(loginUser.pending, pending).addCase(loginUser.fulfilled, authSuccess).addCase(loginUser.rejected, failed)
      .addCase(resetUserPassword.pending, pending).addCase(resetUserPassword.fulfilled, authSuccess).addCase(resetUserPassword.rejected, failed)
      .addCase(getCurrentUser.pending, pending).addCase(getCurrentUser.fulfilled, authSuccess)
      .addCase(getCurrentUser.rejected, (state) => { state.isLoading = false; state.authChecked = true; state.user = null; state.isAuthenticated = false })
      .addCase(logoutUser.pending, pending).addCase(logoutUser.fulfilled, (state) => Object.assign(state, { ...initialState, authChecked: true })).addCase(logoutUser.rejected, failed)
      .addCase(updateProfile.pending, pending).addCase(updateProfile.fulfilled, userSuccess).addCase(updateProfile.rejected, failed)
      .addCase(changePassword.pending, pending).addCase(changePassword.fulfilled, (state) => { state.isLoading = false; state.error = null }).addCase(changePassword.rejected, failed)
      .addCase(addAddress.pending, pending).addCase(addAddress.fulfilled, userSuccess).addCase(addAddress.rejected, failed)
      .addCase(updateAddress.pending, pending).addCase(updateAddress.fulfilled, userSuccess).addCase(updateAddress.rejected, failed)
      .addCase(deleteAddress.pending, pending).addCase(deleteAddress.fulfilled, userSuccess).addCase(deleteAddress.rejected, failed)
      .addCase(setDefaultAddress.pending, pending).addCase(setDefaultAddress.fulfilled, userSuccess).addCase(setDefaultAddress.rejected, failed)
  },
})

export const { clearAuthError, sessionExpired } = authSlice.actions
export default authSlice.reducer
