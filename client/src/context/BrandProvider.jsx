import { BrandContext } from './BrandContext.js'

const brand = Object.freeze({
  name: 'Eshaz Dream World',
  tagline: 'Your Destination | My Passion',
})

function BrandProvider({ children }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export default BrandProvider
