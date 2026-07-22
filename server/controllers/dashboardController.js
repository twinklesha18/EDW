import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import WebsiteVisit from '../models/WebsiteVisit.js'
import { sendSuccess } from '../utils/responseUtils.js'

const sriLankaOffsetMilliseconds = 5.5 * 60 * 60 * 1000
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

export async function getDashboardAnalytics(_request, response) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const [orders, products, customers, pendingOrders, sales, monthly, topCategories, bestSellers, recentOrders, visitors] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: null, totalSales: { $sum: '$total' }, revenue: { $sum: { $subtract: ['$total', '$shippingFee'] } } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfYear }, orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: { month: { $month: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }, { $sort: { '_id.month': 1 } }]),
    Product.aggregate([{ $group: { _id: '$category', products: { $sum: 1 } } }, { $sort: { products: -1 } }, { $limit: 5 }, { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: '$category' }, { $project: { name: '$category.name', products: 1 } }]),
    Order.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } }, { $sort: { sold: -1 } }, { $limit: 5 }]),
    Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(6),
    getVisitorAnalytics(),
  ])
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyMap = new Map(monthly.map((entry) => [entry._id.month, entry]))
  const chart = monthNames.map((month, index) => ({ month, orders: monthlyMap.get(index + 1)?.orders || 0, revenue: monthlyMap.get(index + 1)?.revenue || 0 }))
  return sendSuccess(response, {
    message: 'Dashboard analytics retrieved',
    data: { summary: { totalSales: sales[0]?.totalSales || 0, revenue: sales[0]?.revenue || 0, orders, products, customers, pendingOrders }, monthly: chart, topCategories, bestSellers, recentOrders, visitors },
  })
}
