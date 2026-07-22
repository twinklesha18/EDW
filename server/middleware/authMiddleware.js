import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { AppError } from '../utils/responseUtils.js'
import { clearAuthCookie, refreshAuthCookie } from '../utils/generateToken.js'

export async function protect(request, response, next) {
  const token = request.cookies?.edw_token
  if (!token) return next(new AppError('Authentication required', 401))

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    clearAuthCookie(response)
    return next(new AppError('Your session has expired. Please log in again.', 401))
  }
  const user = await User.findById(payload.sub).select('+sessionVersion')
  if (!user || !user.isActive) {
    clearAuthCookie(response)
    return next(new AppError('Authentication required', 401))
  }
  if (Number(payload.ver || 0) !== Number(user.sessionVersion || 0) || !refreshAuthCookie(response, payload)) {
    clearAuthCookie(response)
    return next(new AppError('Your session has expired. Please log in again.', 401))
  }

  request.user = user
  request.authSession = payload
  next()
}

export const authorizeRoles = (...roles) => (request, _response, next) => {
  if (!request.user || !roles.includes(request.user.role)) return next(new AppError('You are not authorized to access this resource', 403))
  next()
}
