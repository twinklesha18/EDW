import { useEffect, useState } from 'react'
import { FiExternalLink, FiImage, FiRefreshCw } from 'react-icons/fi'
import { checkoutApi } from '../../services/checkoutApi.js'
import { customOrderApi } from '../../services/customOrderApi.js'

function CustomerPaymentSlip({ type = 'order', id, reference, preview = false }) {
  const [state, setState] = useState({ url: '', loading: true, error: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const load = async () => {
      setState({ url: '', loading: true, error: '' })
      try {
        const blob = type === 'custom-order'
          ? await customOrderApi.paymentSlip(id)
          : await checkoutApi.paymentSlip(id)
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, loading: false, error: '' })
      } catch {
        if (active) setState({ url: '', loading: false, error: 'The uploaded payment slip is currently unavailable.' })
      }
    }
    void load()
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, reloadKey, type])

  if (state.loading) {
    return <div className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold/25 text-sm font-semibold text-muted"><FiImage className="animate-pulse" /> Loading uploaded slip...</div>
  }

  if (state.error) {
    return <div className="mt-5 rounded-xl bg-red-50 p-3 text-center text-xs text-red-700"><p>{state.error}</p><button type="button" className="mt-2 inline-flex items-center gap-2 font-semibold" onClick={() => setReloadKey((current) => current + 1)}><FiRefreshCw /> Retry</button></div>
  }

  return preview ? (
    <a href={state.url} target="_blank" rel="noreferrer" className="mt-5 block">
      <img src={state.url} alt={`Uploaded payment slip for ${reference}`} className="max-h-72 w-full rounded-xl border border-gold/15 bg-cream object-contain" />
      <span className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-rosewood"><FiExternalLink /> Open uploaded slip</span>
    </a>
  ) : (
    <a href={state.url} target="_blank" rel="noreferrer" className="secondary-button mt-5 w-full"><FiExternalLink /> View Uploaded Slip</a>
  )
}

export default CustomerPaymentSlip
