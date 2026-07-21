import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isMobileMenuOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
  },
})

export const { closeMobileMenu, toggleMobileMenu } = uiSlice.actions
export default uiSlice.reducer
