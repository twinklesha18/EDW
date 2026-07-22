const tones = {
  Active: 'bg-green-50 text-green-700',
  Paid: 'bg-green-50 text-green-700',
  'COD Collected': 'bg-green-50 text-green-700',
  Delivered: 'bg-green-50 text-green-700',
  Completed: 'bg-green-50 text-green-700',
  Approved: 'bg-green-50 text-green-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Processing: 'bg-blue-50 text-blue-700',
  Reviewing: 'bg-blue-50 text-blue-700',
  Quoted: 'bg-indigo-50 text-indigo-700',
  'Slip Submitted': 'bg-indigo-50 text-indigo-700',
  'In Progress': 'bg-purple-50 text-purple-700',
  Packed: 'bg-purple-50 text-purple-700',
  Shipped: 'bg-purple-50 text-purple-700',
  Refunded: 'bg-purple-50 text-purple-700',
  Pending: 'bg-amber-50 text-amber-700',
  'COD Pending': 'bg-amber-50 text-amber-700',
  'Not Selected': 'bg-slate-100 text-slate-600',
  Inactive: 'bg-slate-100 text-slate-600',
  Hidden: 'bg-slate-100 text-slate-600',
  Cancelled: 'bg-red-50 text-red-700',
  Rejected: 'bg-red-50 text-red-700',
  'Payment Rejected': 'bg-red-50 text-red-700',
  Failed: 'bg-red-50 text-red-700',
  Deleted: 'bg-red-50 text-red-700',
}

function StatusBadge({ children }) {
  const label = String(children)
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[.68rem] font-bold ${tones[label] || 'bg-pink-light text-rosewood'}`}>{label}</span>
}

export default StatusBadge
