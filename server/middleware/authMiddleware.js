import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { AppError } from '../utils/responseUtils.js'

export async function protect(request, _response, next) {
  const token = request.cookies?.edw_token
  if (!token) return next(new AppError('Authentication required', 401))

  const payload = jwt.verify(token, env.jwtSecret)
  const user = await User.findById(payload.sub)
  if (!user || !user.isActive) return next(new AppError('Authentication required', 401))

  request.user = user
  next()
}

export const authorizeRoles = (...roles) => (request, _response, next) => {
  if (!request.user || !roles.includes(request.user.role)) return next(new AppError('You are not authorized to access this resource', 403))
  next()
}
