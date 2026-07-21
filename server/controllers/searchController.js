import Category from '../models/Category.js'
import CustomOrder from '../models/CustomOrder.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { escapeRegex } from '../utils/queryUtils.js'
import { sendSuccess } from '../utils/responseUtils.js'

export async function globalSearch(request, response) {
  const query = String(request.query.q || '').trim().slice(0, 100)
  if (query.length < 2) return sendSuccess(response, { message: 'Search results', data: { products: [], orders: [], customOrders: [], users: [], categories: [] } })
  const pattern = new RegExp(escapeRegex(query), 'i')
  const [products, orders, customOrders, users, categories] = await Promise.all([
    Product.find({ name: pattern }).select('name slug image prices').limit(5),
    Order.find({ orderNumber: pattern }).select('orderNumber orderStatus total createdAt').limit(5),
    CustomOrder.find({ requestNumber: pattern }).select('requestNumber occasion requiredDate status').limit(5),
    User.find({ $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }] }).select('firstName lastName email role').limit(5),
    Category.find({ $or: [{ name: pattern }, { slug: pattern }] }).select('name slug').limit(5),
  ])
  return sendSuccess(response, { message: 'Search results', data: { products, orders, customOrders, users, categories } })
}
