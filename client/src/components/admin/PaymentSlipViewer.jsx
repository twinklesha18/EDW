import { useEffect, useState } from 'react'
import { FiDownload, FiExternalLink, FiImage, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../services/adminApi.js'
import StatusBadge from './StatusBadge.jsx'

function PaymentSlipViewer({ resource, id, reference, status, originalUrl }) {
  const [state, setState] = useState({ url: '', loading: true, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [restoring, setRestoring] = useState(false)

  const restore = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 12 * 1024 * 1024) return toast.error('Payment slip must be smaller than 12 MB.')
    setRestoring(true)
    try {
      await adminApi.replacePaymentSlip(resource, id, file)
      toast.success('Payment slip restored and saved to cloud storage.')
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to restore the payment slip.')
    } finally {
      setRestoring(false)
    }
  }

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
      {state.error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"><p>{state.error}</p><p className="mt-2 text-xs">For a legacy local upload, select the original image once to restore it permanently to cloud storage.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="secondary-button min-h-10" onClick={() => setReloadKey((current) => current + 1)}><FiRefreshCw /> Retry</button><label className="secondary-button min-h-10 cursor-pointer"><FiImage /> {restoring ? 'Restoring...' : 'Restore Slip'}<input type="file" className="sr-only" accept="image/*,.heic,.heif" disabled={restoring} onChange={restore} /></label>{originalUrl && !originalUrl.includes('/uploads/') && <a href={originalUrl} target="_blank" rel="noreferrer" className="secondary-button min-h-10"><FiExternalLink /> Open Original</a>}</div></div>}
      {state.url && <><a href={state.url} target="_blank" rel="noreferrer"><img src={state.url} alt={`Payment slip for ${reference}`} className="mt-5 max-h-[680px] w-full rounded-2xl border border-gold/15 bg-cream object-contain" /></a><div className="mt-4 flex flex-wrap gap-3"><a href={state.url} target="_blank" rel="noreferrer" className="secondary-button"><FiExternalLink /> Open Full Slip</a><a href={state.url} download={`${reference}-payment-slip.png`} className="secondary-button"><FiDownload /> Download Slip</a></div></>}
    </section>
  )
}

export default PaymentSlipViewer
