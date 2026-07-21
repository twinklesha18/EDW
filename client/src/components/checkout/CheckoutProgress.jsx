import { FiCheck } from 'react-icons/fi'

const labels = ['Delivery Address', 'Order Review', 'Payment']
function CheckoutProgress({ step }) {
  return <ol className="grid grid-cols-3 gap-2" aria-label="Checkout progress">{labels.map((label, index) => { const number = index + 1, complete = step > number, active = step === number; return <li key={label} className="relative text-center"><div className={`mx-auto grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition ${complete ? 'border-rosewood bg-rosewood text-white' : active ? 'border-gold bg-pink-light text-rosewood' : 'border-gold/20 bg-white text-muted'}`}>{complete ? <FiCheck /> : number}</div><p className={`mt-2 text-[.65rem] font-semibold sm:text-xs ${active ? 'text-rosewood' : 'text-muted'}`}>{label}</p>{index < labels.length - 1 && <span className={`absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-5 h-px ${complete ? 'bg-rosewood' : 'bg-gold/20'}`} />}</li> })}</ol>
}
export default CheckoutProgress
