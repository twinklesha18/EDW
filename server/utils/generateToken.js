import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const durationToMilliseconds = (duration) => {
  const match = String(duration).match(/^(\d+)([dhm])$/i)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const value = Number(match[1])
  const units = { d: 86400000, h: 3600000, m: 60000 }
  return value * units[match[2].toLowerCase()]
}

export function setAuthCookie(response, userId, rememberMe = false) {
  const expiresIn = rememberMe ? env.jwtRememberExpiresIn : env.jwtExpiresIn
  const token = jwt.sign({ sub: userId.toString() }, env.jwtSecret, { expiresIn })

  response.cookie('edw_token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: durationToMilliseconds(expiresIn),
    path: '/',
  })
}

export function clearAuthCookie(response) {
  response.clearCookie('edw_token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  })
}
