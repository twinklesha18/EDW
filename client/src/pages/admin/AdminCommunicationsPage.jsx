import { useCallback, useState } from 'react'
import { FiEye, FiMail, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AdminFormModal from '../../components/admin/AdminFormModal.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'

const formatDateTime = (value) => new Intl.DateTimeFormat('en-LK', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Colombo',
}).format(new Date(value))

function AdminCommunicationsPage() {
  const [messageQuery, setMessageQuery] = useState({ page: 1, search: '', status: '' })
  const [subscriberQuery, setSubscriberQuery] = useState({ page: 1, search: '', status: 'active' })
  const [selectedMessage, setSelectedMessage] = useState(null)

  const messageFetcher = useCallback(
    () => adminApi.list('communications/contact-messages', messageQuery),
    [messageQuery],
  )
  const subscriberFetcher = useCallback(
    () => adminApi.list('communications/newsletter-subscribers', subscriberQuery),
    [subscriberQuery],
  )
  const messages = useAdminQuery(messageFetcher)
  const subscribers = useAdminQuery(subscriberFetcher)

  const viewMessage = async (message) => {
    setSelectedMessage(message)
    if (message.status === 'Read') return
    try {
      const response = await adminApi.patch('communications/contact-messages', message.id, 'read')
      setSelectedMessage(response.data.contactMessage)
      messages.reload()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update the message status.')
    }
  }

  const messageColumns = [
    { key: 'fullName', label: 'Customer', render: (row) => <div><p className="font-semibold">{row.fullName}</p><a href={`mailto:${row.email}`} className="break-all text-xs text-rosewood hover:underline">{row.email}</a><a href={`tel:${row.phone}`} className="mt-1 block text-xs text-muted hover:text-rosewood">{row.phone}</a></div> },
    { key: 'subject', label: 'Subject' },
    { key: 'message', label: 'Message', render: (row) => <p className="max-w-sm line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-muted">{row.message}</p> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge>{row.status}</StatusBadge> },
    { key: 'createdAt', label: 'Received', render: (row) => <time className="whitespace-nowrap text-xs">{formatDateTime(row.createdAt)}</time> },
    { key: 'view', label: 'View', render: (row) => <button type="button" className="icon-button" onClick={() => viewMessage(row)} aria-label={`View message from ${row.fullName}`}><FiEye /></button> },
  ]
  const subscriberColumns = [
    { key: 'email', label: 'Email address', render: (row) => <a href={`mailto:${row.email}`} className="break-all font-medium text-rosewood hover:underline">{row.email}</a> },
    { key: 'isActive', label: 'Status', render: (row) => <StatusBadge>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge> },
    { key: 'subscribedAt', label: 'Subscribed', render: (row) => <time>{formatDateTime(row.subscribedAt)}</time> },
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Messages & Subscribers" description="View every customer contact message and newsletter subscription received through the website." />

      <section className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gold/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiMail /></span>
            <div><h2 className="font-serif text-2xl font-semibold">Contact Messages</h2><p className="text-xs text-muted">{messages.data?.pagination?.total || 0} messages received</p></div>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(14rem,1fr)_10rem]">
            <input className="input-field" placeholder="Search messages…" value={messageQuery.search} onChange={(event) => setMessageQuery((current) => ({ ...current, page: 1, search: event.target.value }))} />
            <select className="input-field" value={messageQuery.status} onChange={(event) => setMessageQuery((current) => ({ ...current, page: 1, status: event.target.value }))}>
              <option value="">All messages</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>
        </div>
        {messages.error ? <p className="p-5 text-red-600">{messages.error}</p> : <DataTable columns={messageColumns} rows={messages.data?.messages} loading={messages.loading} emptyTitle="No contact messages found" />}
        <AdminPagination pagination={messages.data?.pagination} onPage={(page) => setMessageQuery((current) => ({ ...current, page }))} />
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gold/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-light text-rosewood"><FiUsers /></span>
            <div><h2 className="font-serif text-2xl font-semibold">Newsletter Subscribers</h2><p className="text-xs text-muted">{subscribers.data?.pagination?.total || 0} subscriber records</p></div>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(14rem,1fr)_10rem]">
            <input className="input-field" placeholder="Search email addresses…" value={subscriberQuery.search} onChange={(event) => setSubscriberQuery((current) => ({ ...current, page: 1, search: event.target.value }))} />
            <select className="input-field" value={subscriberQuery.status} onChange={(event) => setSubscriberQuery((current) => ({ ...current, page: 1, status: event.target.value }))}>
              <option value="">All subscribers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {subscribers.error ? <p className="p-5 text-red-600">{subscribers.error}</p> : <DataTable columns={subscriberColumns} rows={subscribers.data?.subscribers} loading={subscribers.loading} emptyTitle="No newsletter subscribers found" />}
        <AdminPagination pagination={subscribers.data?.pagination} onPage={(page) => setSubscriberQuery((current) => ({ ...current, page }))} />
      </section>

      <AdminFormModal open={Boolean(selectedMessage)} title={selectedMessage?.subject || 'Contact Message'} onClose={() => setSelectedMessage(null)}>
        {selectedMessage && (
          <div className="space-y-5">
            <dl className="grid gap-4 rounded-2xl bg-cream p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted">Full name</dt><dd className="mt-1 font-medium">{selectedMessage.fullName}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Received</dt><dd className="mt-1">{formatDateTime(selectedMessage.createdAt)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Email</dt><dd className="mt-1"><a href={`mailto:${selectedMessage.email}`} className="break-all text-rosewood hover:underline">{selectedMessage.email}</a></dd></div>
              <div><dt className="text-xs font-semibold text-muted">Phone number</dt><dd className="mt-1"><a href={`tel:${selectedMessage.phone}`} className="text-rosewood hover:underline">{selectedMessage.phone}</a></dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-semibold text-muted">Subject</dt><dd className="mt-1 font-medium">{selectedMessage.subject}</dd></div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold">Message</h3>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-gold/15 bg-white p-4 text-sm leading-7 text-muted">{selectedMessage.message}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`} className="primary-button"><FiMail /> Reply by Email</a>
              <a href={`tel:${selectedMessage.phone}`} className="secondary-button">Call Customer</a>
            </div>
          </div>
        )}
      </AdminFormModal>
    </div>
  )
}

export default AdminCommunicationsPage
