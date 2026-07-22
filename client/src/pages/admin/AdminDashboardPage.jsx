import { useCallback, useEffect } from 'react'
import {
  FiActivity,
  FiBox,
  FiClock,
  FiDollarSign,
  FiEye,
  FiMonitor,
  FiMousePointer,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const colors = ['#A94F73', '#C8A96B', '#DCCEF8', '#D8EEF8', '#F6B8CE']
const deviceLabels = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
const formatDateLabel = (value) => new Intl.DateTimeFormat('en-LK', { month: 'short', day: 'numeric', timeZone: 'Asia/Colombo' }).format(new Date(`${value}T00:00:00+05:30`))

function MetricCard({ label, value, icon: Icon, accent = false }) {
  return (
    <article className={`rounded-[1.5rem] border p-5 shadow-[0_15px_40px_-32px_rgba(59,47,54,.5)] ${accent ? 'border-rosewood/20 bg-ink text-white' : 'border-gold/15 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs ${accent ? 'text-white/70' : 'text-muted'}`}>{label}</p>
          <p className="mt-2 font-serif text-2xl font-semibold">{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent ? 'bg-white/15 text-pink-light' : 'bg-pink-light text-rosewood'}`}><Icon /></span>
      </div>
    </article>
  )
}

function AdminDashboardPage() {
  const fetcher = useCallback(() => adminApi.dashboard(), [])
  const { data, loading, error, reload } = useAdminQuery(fetcher)

  useEffect(() => {
    const intervalId = window.setInterval(reload, 60 * 1000)
    return () => window.clearInterval(intervalId)
  }, [reload])

  if (error) return <ErrorState message={error} onRetry={reload} />

  const summary = data?.summary || {}
  const visitorSummary = data?.visitors?.summary || {}
  const storeCards = [
    { label: 'Total Sales', value: formatCurrency(summary.totalSales || 0), icon: FiTrendingUp },
    { label: 'Revenue', value: formatCurrency(summary.revenue || 0), icon: FiDollarSign },
    { label: 'Orders', value: summary.orders || 0, icon: FiShoppingBag },
    { label: 'Products', value: summary.products || 0, icon: FiBox },
    { label: 'Customers', value: summary.customers || 0, icon: FiUsers },
    { label: 'Pending Orders', value: summary.pendingOrders || 0, icon: FiClock },
  ]
  const visitorCards = [
    { label: 'Online now', value: visitorSummary.activeVisitors || 0, icon: FiActivity, accent: true },
    { label: "Today's visitors", value: visitorSummary.todayVisitors || 0, icon: FiUsers },
    { label: 'Unique visitors', value: visitorSummary.totalVisitors || 0, icon: FiEye },
    { label: 'Total visits', value: visitorSummary.totalVisits || 0, icon: FiMonitor },
    { label: 'Page views', value: visitorSummary.pageViews || 0, icon: FiMousePointer },
  ]
  const recentColumns = [
    { key: 'orderNumber', label: 'Order' },
    { key: 'customer', label: 'Customer', render: (row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : 'Deleted user' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge>{row.orderStatus}</StatusBadge> },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Dashboard" description="A live overview of your website visitors, customers, products, and order performance." />

      <section aria-labelledby="visitor-analytics-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Live analytics</p>
            <h2 id="visitor-analytics-title" className="mt-1 font-serif text-3xl font-semibold">Website Visitors</h2>
          </div>
          <p className="text-xs text-muted">Automatically refreshes every minute · Online means active in the last 5 minutes</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {visitorCards.map((card) => <MetricCard key={card.label} {...card} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-[1.75rem] border border-gold/15 bg-white p-5 sm:p-6">
            <h3 className="font-serif text-2xl font-semibold">Visitor Trend</h3>
            <p className="mt-1 text-xs text-muted">Anonymous storefront traffic over the last 14 days</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.visitors?.daily || []}>
                  <defs>
                    <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A94F73" stopOpacity={.35} /><stop offset="95%" stopColor="#A94F73" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eadde2" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 10 }} minTickGap={18} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={formatDateLabel} />
                  <Area type="monotone" dataKey="visitors" name="Unique visitors" stroke="#A94F73" fill="url(#visitors)" strokeWidth={2} />
                  <Area type="monotone" dataKey="visits" name="Visits" stroke="#C8A96B" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="pageViews" name="Page views" stroke="#6F6170" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-[1.75rem] border border-gold/15 bg-white p-5 sm:p-6">
            <h3 className="font-serif text-2xl font-semibold">Visits by Device</h3>
            <p className="mt-1 text-xs text-muted">All-time visit sessions</p>
            <div className="mt-6 space-y-4">
              {(data?.visitors?.devices || []).length ? data.visitors.devices.map((item, index) => {
                const total = visitorSummary.totalVisits || 1
                const percentage = Math.round((item.visits / total) * 100)
                return (
                  <div key={item.device}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span>{deviceLabels[item.device] || item.device}</span><strong>{item.visits} <span className="font-normal text-muted">({percentage}%)</span></strong></div>
                    <div className="h-2 overflow-hidden rounded-full bg-pink-light"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: colors[index % colors.length] }} /></div>
                  </div>
                )
              }) : <p className="rounded-2xl bg-cream p-4 text-sm text-muted">Visitor data will appear after people browse the storefront.</p>}
            </div>
            <p className="mt-6 text-xs leading-5 text-muted">Analytics are anonymous. Customer names, emails, and raw IP addresses are not collected.</p>
          </section>
        </div>
      </section>

      <section aria-labelledby="store-overview-title" className="space-y-4">
        <h2 id="store-overview-title" className="font-serif text-3xl font-semibold">Store Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {storeCards.map((card) => <MetricCard key={card.label} {...card} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-[1.75rem] border border-gold/15 bg-white p-5 sm:p-6">
          <h2 className="font-serif text-2xl font-semibold">Revenue & Monthly Orders</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly || []}>
                <defs><linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A94F73" stopOpacity={.35} /><stop offset="95%" stopColor="#A94F73" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eadde2" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                <Area type="monotone" dataKey="revenue" stroke="#A94F73" fill="url(#revenue)" />
                <Area type="monotone" dataKey="orders" stroke="#C8A96B" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-[1.75rem] border border-gold/15 bg-white p-5 sm:p-6">
          <h2 className="font-serif text-2xl font-semibold">Top Categories</h2>
          <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.topCategories || []} dataKey="products" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>{(data?.topCategories || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <div className="space-y-2">{data?.topCategories?.map((item, index) => <div key={item.name} className="flex justify-between text-xs"><span><i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}</span><strong>{item.products} products</strong></div>)}</div>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white"><div className="p-5"><h2 className="font-serif text-2xl font-semibold">Recent Orders</h2></div><DataTable columns={recentColumns} rows={data?.recentOrders || []} loading={loading} emptyTitle="No orders yet" /></div>
        <div className="rounded-[1.75rem] border border-gold/15 bg-white p-5"><h2 className="font-serif text-2xl font-semibold">Best Selling Products</h2><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.bestSellers || []} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="sold" fill="#A94F73" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></div>
      </section>
    </div>
  )
}

export default AdminDashboardPage
