import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const idleMilliseconds = () => env.session.idleMinutes * 60 * 1000
const absoluteMilliseconds = (rememberMe) => rememberMe
  ? env.session.rememberDays * 24 * 60 * 60 * 1000
  : env.session.absoluteHours * 60 * 60 * 1000

export function setAuthCookie(response, userId, rememberMe = false, sessionStartedAt = Date.now(), sessionVersion = 0) {
  const startedAt = Number(sessionStartedAt) || Date.now()
  const absoluteRemaining = startedAt + absoluteMilliseconds(rememberMe) - Date.now()
  const maxAge = Math.min(idleMilliseconds(), absoluteRemaining)
  if (maxAge <= 0) return false
  const token = jwt.sign(
    { sub: userId.toString(), sst: Math.floor(startedAt / 1000), rem: Boolean(rememberMe), ver: Number(sessionVersion) || 0 },
    env.jwtSecret,
    { expiresIn: Math.max(1, Math.ceil(maxAge / 1000)) },
  )

  response.cookie('edw_token', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge,
    path: '/',
  })
  response.setHeader('X-Session-Idle-Minutes', String(env.session.idleMinutes))
  return true
}

export function refreshAuthCookie(response, payload) {
  const startedAt = Number(payload.sst || payload.iat) * 1000
  return setAuthCookie(response, payload.sub, payload.rem === true, startedAt, payload.ver)
}

export function clearAuthCookie(response) {
  response.clearCookie('edw_token', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  })
}
