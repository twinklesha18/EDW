import { FiCheckCircle, FiCircle } from 'react-icons/fi'

const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered']
function OrderTimeline({ timeline = [], status }) {
  const events = new Map(timeline.map((event) => [event.status, event]))
  if (status === 'Cancelled') {
    const event = events.get('Cancelled')
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><p className="font-semibold">Order Cancelled</p><p className="mt-1 text-xs">{event ? new Date(event.timestamp).toLocaleString() : 'This order was cancelled.'}</p></div>
  }
  const currentIndex = statuses.indexOf(status)
  return <ol className="space-y-0">{statuses.map((item, index) => { const done = index <= currentIndex, event = events.get(item); return <li key={item} className="relative flex gap-4 pb-7 last:pb-0">{index < statuses.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-px ${index < currentIndex ? 'bg-rosewood' : 'bg-gold/20'}`} />}<span className={`relative z-10 mt-0.5 bg-white text-xl ${done ? 'text-rosewood' : 'text-gold/25'}`}>{done ? <FiCheckCircle /> : <FiCircle />}</span><div><p className={`text-sm font-semibold ${done ? 'text-ink' : 'text-muted'}`}>{item}</p>{event && <><p className="mt-1 text-xs text-muted">{new Date(event.timestamp).toLocaleString()}</p>{event.note && <p className="mt-1 text-xs text-muted">{event.note}</p>}</>}</div></li> })}</ol>
}
export default OrderTimeline
