import { useEffect, useState } from 'react'
import { FiDownload, FiExternalLink, FiImage, FiRefreshCw } from 'react-icons/fi'
import { adminApi } from '../../services/adminApi.js'
import StatusBadge from './StatusBadge.jsx'

function PaymentSlipViewer({ resource, id, reference, status, originalUrl }) {
  const [state, setState] = useState({ url: '', loading: true, error: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const load = async () => {
      setState({ url: '', loading: true, error: '' })
      try {
        const blob = await adminApi.paymentSlip(resource, id)
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, loading: false, error: '' })
      } catch (error) {
        if (active) setState({ url: '', loading: false, error: error.response?.data?.message || 'The payment slip could not be displayed.' })
      }
    }
    void load()
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id, reloadKey, resource])

  return (
    <section className="form-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-serif text-2xl font-semibold">Bank Payment Slip</h2><p className="mt-1 text-sm text-muted">Review the uploaded transfer proof before approving payment.</p></div>
        <StatusBadge>{status}</StatusBadge>
      </div>
      {state.loading && <div className="mt-5 grid min-h-64 place-items-center rounded-2xl bg-cream"><div className="text-center text-muted"><FiImage className="mx-auto animate-pulse text-3xl" /><p className="mt-2 text-sm">Loading payment slip…</p></div></div>}
      {state.error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"><p>{state.error}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="secondary-button min-h-10" onClick={() => setReloadKey((current) => current + 1)}><FiRefreshCw /> Retry</button>{originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer" className="secondary-button min-h-10"><FiExternalLink /> Open Original</a>}</div></div>}
      {state.url && <><a href={state.url} target="_blank" rel="noreferrer"><img src={state.url} alt={`Payment slip for ${reference}`} className="mt-5 max-h-[680px] w-full rounded-2xl border border-gold/15 bg-cream object-contain" /></a><div className="mt-4 flex flex-wrap gap-3"><a href={state.url} target="_blank" rel="noreferrer" className="secondary-button"><FiExternalLink /> Open Full Slip</a><a href={state.url} download={`${reference}-payment-slip.png`} className="secondary-button"><FiDownload /> Download Slip</a></div></>}
    </section>
  )
}

export default PaymentSlipViewer
