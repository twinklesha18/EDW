import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { sendSuccess } from '../utils/responseUtils.js'

export async function getDashboardAnalytics(_request, response) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const [orders, products, customers, pendingOrders, sales, monthly, topCategories, bestSellers, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: null, totalSales: { $sum: '$total' }, revenue: { $sum: { $subtract: ['$total', '$shippingFee'] } } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfYear }, orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: { month: { $month: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }, { $sort: { '_id.month': 1 } }]),
    Product.aggregate([{ $group: { _id: '$category', products: { $sum: 1 } } }, { $sort: { products: -1 } }, { $limit: 5 }, { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: '$category' }, { $project: { name: '$category.name', products: 1 } }]),
    Order.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } }, { $sort: { sold: -1 } }, { $limit: 5 }]),
    Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(6),
  ])
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyMap = new Map(monthly.map((entry) => [entry._id.month, entry]))
  const chart = monthNames.map((month, index) => ({ month, orders: monthlyMap.get(index + 1)?.orders || 0, revenue: monthlyMap.get(index + 1)?.revenue || 0 }))
  return sendSuccess(response, {
    message: 'Dashboard analytics retrieved',
    data: { summary: { totalSales: sales[0]?.totalSales || 0, revenue: sales[0]?.revenue || 0, orders, products, customers, pendingOrders }, monthly: chart, topCategories, bestSellers, recentOrders },
  })
}
