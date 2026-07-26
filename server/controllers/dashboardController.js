import Category from '../models/Category.js'
import ContactMessage from '../models/ContactMessage.js'
import NewsletterSubscriber from '../models/NewsletterSubscriber.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import WebsiteVisit from '../models/WebsiteVisit.js'
import { sendSuccess } from '../utils/responseUtils.js'

const sriLankaOffsetMilliseconds = 5.5 * 60 * 60 * 1000
const dashboardCacheMilliseconds = 30 * 1000
let dashboardCache = { expiresAt: 0, promise: null }
const dateKeyInSriLanka = (date) => new Date(date.getTime() + sriLankaOffsetMilliseconds).toISOString().slice(0, 10)

const startOfSriLankaDay = (date = new Date()) => {
  const local = new Date(date.getTime() + sriLankaOffsetMilliseconds)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - sriLankaOffsetMilliseconds)
}

async function getVisitorAnalytics() {
  const now = new Date()
  const todayStart = startOfSriLankaDay(now)
  const trendStart = new Date(todayStart)
  trendStart.setUTCDate(trendStart.getUTCDate() - 13)
  const activeSince = new Date(now.getTime() - 5 * 60 * 1000)

  const [facets, dailyRows, deviceRows] = await Promise.all([
    WebsiteVisit.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, visits: { $sum: 1 }, pageViews: { $sum: '$pageViews' } } }],
          visitors: [{ $group: { _id: '$visitorHash' } }, { $count: 'count' }],
          todayVisitors: [{ $match: { lastSeenAt: { $gte: todayStart } } }, { $group: { _id: '$visitorHash' } }, { $count: 'count' }],
          activeVisitors: [{ $match: { lastSeenAt: { $gte: activeSince } } }, { $group: { _id: '$visitorHash' } }, { $count: 'count' }],
        },
      },
    ]),
    WebsiteVisit.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: 'Asia/Colombo' } },
          visits: { $sum: 1 },
          pageViews: { $sum: '$pageViews' },
          visitorIds: { $addToSet: '$visitorHash' },
        },
      },
      { $project: { _id: 0, date: '$_id', visits: 1, pageViews: 1, visitors: { $size: '$visitorIds' } } },
      { $sort: { date: 1 } },
    ]),
    WebsiteVisit.aggregate([
      { $group: { _id: '$deviceType', visits: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id', visits: 1 } },
      { $sort: { visits: -1 } },
    ]),
  ])

  const dailyMap = new Map(dailyRows.map((row) => [row.date, row]))
  const daily = Array.from({ length: 14 }, (_value, index) => {
    const date = new Date(trendStart)
    date.setUTCDate(date.getUTCDate() + index)
    const key = dateKeyInSriLanka(date)
    return dailyMap.get(key) || { date: key, visitors: 0, visits: 0, pageViews: 0 }
  })
  const result = facets[0] || {}

  return {
    summary: {
      activeVisitors: result.activeVisitors?.[0]?.count || 0,
      todayVisitors: result.todayVisitors?.[0]?.count || 0,
      totalVisitors: result.visitors?.[0]?.count || 0,
      totalVisits: result.totals?.[0]?.visits || 0,
      pageViews: result.totals?.[0]?.pageViews || 0,
    },
    daily,
    devices: deviceRows,
  }
}

async function loadDashboardAnalytics() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const [
    orderFacets,
    recentOrders,
    products,
    customers,
    topCategories,
    visitors,
    contactFacets,
    subscriberFacets,
  ] = await Promise.all([
    Order.aggregate([{
      $facet: {
        orders: [{ $count: 'count' }],
        pendingOrders: [{ $match: { orderStatus: 'Pending' } }, { $count: 'count' }],
        sales: [
          { $match: { paymentStatus: 'Paid', orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalSales: { $sum: '$total' }, revenue: { $sum: { $subtract: ['$total', '$shippingFee'] } } } },
        ],
        monthly: [
          { $match: { createdAt: { $gte: startOfYear }, orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: { month: { $month: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { '_id.month': 1 } },
        ],
        bestSellers: [
          { $match: { orderStatus: { $ne: 'Cancelled' } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } },
          { $sort: { sold: -1 } },
          { $limit: 5 },
        ],
      },
    }]),
    Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(6).lean(),
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.aggregate([{ $group: { _id: '$category', products: { $sum: 1 } } }, { $sort: { products: -1 } }, { $limit: 5 }, { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: '$category' }, { $project: { name: '$category.name', products: 1 } }]),
    getVisitorAnalytics(),
    ContactMessage.aggregate([{
      $facet: {
        total: [{ $count: 'count' }],
        unread: [{ $match: { status: 'Unread' } }, { $count: 'count' }],
        recent: [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
      },
    }]),
    NewsletterSubscriber.aggregate([{
      $facet: {
        active: [{ $match: { isActive: true } }, { $count: 'count' }],
        recent: [{ $match: { isActive: true } }, { $sort: { subscribedAt: -1 } }, { $limit: 5 }],
      },
    }]),
  ])
  const orderData = orderFacets[0] || {}
  const contactData = contactFacets[0] || {}
  const subscriberData = subscriberFacets[0] || {}
  const monthly = orderData.monthly || []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyMap = new Map(monthly.map((entry) => [entry._id.month, entry]))
  const chart = monthNames.map((month, index) => ({ month, orders: monthlyMap.get(index + 1)?.orders || 0, revenue: monthlyMap.get(index + 1)?.revenue || 0 }))
  return {
    summary: {
      totalSales: orderData.sales?.[0]?.totalSales || 0,
      revenue: orderData.sales?.[0]?.revenue || 0,
      orders: orderData.orders?.[0]?.count || 0,
      products,
      customers,
      pendingOrders: orderData.pendingOrders?.[0]?.count || 0,
    },
    monthly: chart,
    topCategories,
    bestSellers: orderData.bestSellers || [],
    recentOrders,
    visitors,
    communications: {
      summary: {
        contactMessages: contactData.total?.[0]?.count || 0,
        unreadMessages: contactData.unread?.[0]?.count || 0,
        activeSubscribers: subscriberData.active?.[0]?.count || 0,
      },
      recentContactMessages: contactData.recent || [],
      recentSubscribers: subscriberData.recent || [],
    },
  }
}

export async function getDashboardAnalytics(_request, response) {
  if (!dashboardCache.promise || dashboardCache.expiresAt <= Date.now()) {
    const promise = loadDashboardAnalytics().catch((error) => {
      if (dashboardCache.promise === promise) dashboardCache = { expiresAt: 0, promise: null }
      throw error
    })
    dashboardCache = { expiresAt: Date.now() + dashboardCacheMilliseconds, promise }
  }
  return sendSuccess(response, {
    message: 'Dashboard analytics retrieved',
    data: await dashboardCache.promise,
  })
}
