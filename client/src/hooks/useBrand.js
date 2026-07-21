import { useContext } from 'react'
import { BrandContext } from '../context/BrandContext.js'

export function useBrand() {
  const brand = useContext(BrandContext)

  if (!brand) {
    throw new Error('useBrand must be used within BrandProvider')
  }

  return brand
}
