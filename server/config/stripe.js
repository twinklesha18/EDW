import Stripe from 'stripe'
import { env } from './env.js'

export const isStripeConfigured = env.stripe.secretKey.startsWith('sk_')
const stripe = isStripeConfigured ? new Stripe(env.stripe.secretKey) : null

export default stripe
