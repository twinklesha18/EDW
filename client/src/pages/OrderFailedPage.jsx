import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import PageTransition from '../components/common/PageTransition.jsx'

function OrderFailedPage() { return <PageTransition><section className="section-shell py-16"><div className="mx-auto max-w-xl rounded-[2rem] border border-red-100 bg-white p-9 text-center shadow-luxury"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-50 text-4xl text-red-600"><FiAlertCircle /></span><h1 className="mt-6 font-serif text-4xl font-semibold">Payment Not Completed</h1><p className="mt-3 text-sm leading-6 text-muted">Your order was not created and your cart remains available. Review your card details or choose Cash on Delivery.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/checkout" className="primary-button"><FiArrowLeft /> Return to Checkout</Link><Link to="/cart" className="secondary-button">View Cart</Link></div></div></section></PageTransition> }
export default OrderFailedPage
