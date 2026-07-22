import { notifyAdmins, notifySafely, notifyUser } from './notificationService.js'

const normalCustomerLink = (order) => `/orders/${order.orderNumber}`
const normalAdminLink = (order) => `/admin/orders/${order._id}`
const customCustomerLink = (order) => `/profile/custom-orders/${order._id}`
const customAdminLink = (order) => `/admin/custom-orders/${order._id}`

export const notifyNormalOrderPlaced = (order, user) => notifySafely(async () => Promise.all([
  notifyUser({ user, type: 'order_placed', title: `Order ${order.orderNumber} placed`, message: `We received your order. The current status is ${order.orderStatus}, and payment is ${order.paymentStatus}.`, link: normalCustomerLink(order), order }),
  notifyAdmins({ type: 'new_order', title: `New order ${order.orderNumber}`, message: `${user.firstName} ${user.lastName} placed a ${order.paymentMethod} order for LKR ${Number(order.total).toLocaleString('en-LK')}.`, link: normalAdminLink(order), order }),
]))

export const notifyNormalOrderStatus = (order, user) => notifySafely(() => notifyUser({
  user, type: order.orderStatus === 'Delivered' ? 'order_delivered' : 'order_status',
  title: order.orderStatus === 'Delivered' ? `Order ${order.orderNumber} delivered` : `Order ${order.orderNumber}: ${order.orderStatus}`,
  message: `Your order status changed to ${order.orderStatus}.${order.trackingNumber ? ` Tracking number: ${order.trackingNumber}.` : ''}`,
  link: normalCustomerLink(order), order,
}))

export const notifyNormalOrderPayment = (order, user, note = '') => notifySafely(() => notifyUser({
  user, type: 'payment_status', title: `Payment update for ${order.orderNumber}`,
  message: `Payment status changed to ${order.paymentStatus}.${note ? ` ${note}` : ''}`,
  link: normalCustomerLink(order), order,
}))

export const notifyNormalOrderTracking = (order, user) => notifySafely(() => notifyUser({
  user, type: 'tracking_update', title: `Tracking updated for ${order.orderNumber}`,
  message: `Your tracking number is ${order.trackingNumber}.`, link: normalCustomerLink(order), order,
}))

export const notifyNormalOrderAdminEvent = (order, title, message) => notifySafely(() => notifyAdmins({
  type: 'order_action', title, message, link: normalAdminLink(order), order,
}))

export const notifyCustomOrderPlaced = (order, user) => notifySafely(async () => Promise.all([
  notifyUser({ user, type: 'custom_order_placed', title: `Custom request ${order.requestNumber} submitted`, message: 'We received your custom-order request and will review it shortly.', link: customCustomerLink(order), customOrder: order }),
  notifyAdmins({ type: 'new_custom_order', title: `New custom request ${order.requestNumber}`, message: `${user.firstName} ${user.lastName} submitted a custom order for ${order.occasion}.`, link: customAdminLink(order), customOrder: order }),
]))

export const notifyCustomOrderStatus = (order, user, message) => notifySafely(() => notifyUser({
  user, type: order.status === 'Completed' ? 'custom_order_completed' : 'custom_order_status',
  title: `${order.requestNumber}: ${order.status}`,
  message: message || `Your custom-order status changed to ${order.status}.`,
  link: customCustomerLink(order), customOrder: order,
}))

export const notifyCustomOrderPayment = (order, user, note = '') => notifySafely(() => notifyUser({
  user, type: 'custom_payment_status', title: `Payment update for ${order.requestNumber}`,
  message: `Payment status changed to ${order.paymentStatus}.${note ? ` ${note}` : ''}`,
  link: customCustomerLink(order), customOrder: order,
}))

export const notifyCustomOrderAdminEvent = (order, title, message) => notifySafely(() => notifyAdmins({
  type: 'custom_order_action', title, message, link: customAdminLink(order), customOrder: order,
}))
