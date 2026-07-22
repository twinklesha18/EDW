import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect } from 'react'
import { FiShoppingBag, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { removeCartItem, toggleCartDrawer, updateCartQuantity } from '../../redux/slices/cartSlice.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import CartItem from './CartItem.jsx'

function CartDrawer() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const { isCartOpen, items, itemCount, subtotal, isLoading } = useSelector((state) => state.cart)
  const close = useCallback(() => dispatch(toggleCartDrawer(false)), [dispatch])
  const checkout = () => {
    close()
    if (isAuthenticated) navigate('/checkout')
    else navigate('/login', { state: { from: '/checkout' } })
  }

  useEffect(() => { close() }, [close, location.pathname])
  useEffect(() => {
    if (!isCartOpen) return undefined
    const key = (event) => event.key === 'Escape' && close()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', key)
    }
  }, [close, isCartOpen])

  const remove = async (id) => {
    try {
      await dispatch(removeCartItem(id)).unwrap()
      toast.success('Item removed successfully.')
    } catch (error) {
      toast.error(error?.message || 'Unable to remove item.')
    }
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.button type="button" className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-sm" aria-label="Close cart drawer" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" className="fixed inset-y-0 right-0 z-[75] flex h-dvh w-[min(96vw,430px)] flex-col bg-cream shadow-2xl" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}>
            <header className="flex shrink-0 items-center justify-between border-b border-gold/15 px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <h2 id="cart-drawer-title" className="font-serif text-2xl font-semibold">Your Cart</h2>
                <p className="text-xs text-muted">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
              </div>
              <button type="button" className="icon-button" onClick={close} aria-label="Close cart"><FiX /></button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
              {items.map((item) => <CartItem key={item._id || item.id} item={item} compact disabled={isLoading} onQuantity={(itemId, quantity) => dispatch(updateCartQuantity({ itemId, quantity }))} onRemove={remove} />)}
              {!items.length && (
                <div className="grid h-full place-items-center py-20 text-center">
                  <div>
                    <FiShoppingBag className="mx-auto text-4xl text-pink-primary" />
                    <p className="mt-4 font-serif text-2xl font-semibold">Your cart is empty</p>
                    <Link to="/shop" onClick={close} className="primary-button mt-5">Explore Gifts</Link>
                  </div>
                </div>
              )}
            </div>
            {items.length > 0 && (
              <footer className="safe-area-bottom shrink-0 border-t border-gold/15 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted">Subtotal</span>
                  <strong className="break-words font-serif text-2xl text-rosewood">{formatCurrency(subtotal)}</strong>
                </div>
                <Link to="/cart" onClick={close} className="primary-button mt-4 w-full">View Cart</Link>
                <button type="button" onClick={checkout} className="secondary-button mt-2 w-full">Proceed to Checkout</button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer
