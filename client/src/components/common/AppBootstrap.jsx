import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser, sessionExpired } from '../../redux/slices/authSlice.js'
import { syncGuestCart } from '../../redux/slices/cartSlice.js'
import { syncGuestWishlist } from '../../redux/slices/wishlistSlice.js'
import { fetchCatalog } from '../../redux/slices/catalogSlice.js'

function AppBootstrap({ children }) {
  const dispatch = useDispatch()
  const { authChecked, isAuthenticated, user } = useSelector((state) => state.auth)
  const synchronizedUser = useRef(null)

  useEffect(() => { dispatch(getCurrentUser()) }, [dispatch])
  useEffect(() => { dispatch(fetchCatalog()) }, [dispatch])
  useEffect(() => {
    const expire = () => dispatch(sessionExpired())
    window.addEventListener('edw:unauthorized', expire)
    return () => window.removeEventListener('edw:unauthorized', expire)
  }, [dispatch])
  useEffect(() => {
    if (isAuthenticated && user?.id && synchronizedUser.current !== user.id) {
      synchronizedUser.current = user.id
      dispatch(syncGuestCart())
      dispatch(syncGuestWishlist())
    }
    if (!isAuthenticated) synchronizedUser.current = null
  }, [dispatch, isAuthenticated, user?.id])

  if (!authChecked) return <div className="grid min-h-screen place-items-center bg-cream"><div className="text-center"><div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-pink-primary border-t-rosewood" /><p className="mt-4 font-serif text-xl text-ink">Eshaz Dream World</p></div></div>
  return children
}
export default AppBootstrap
