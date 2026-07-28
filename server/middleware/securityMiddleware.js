import { AppError } from '../utils/responseUtils.js'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor'])
const maximumInputDepth = 20
const maximumInputNodes = 5000

const inspectObject = (value, path, state, depth = 0) => {
  if (value === null || typeof value !== 'object') return
  if (depth > maximumInputDepth) throw new AppError('Request data is nested too deeply', 400)
  state.nodes += 1
  if (state.nodes > maximumInputNodes) throw new AppError('Request contains too many fields', 413)

  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key) || key.startsWith('$') || key.includes('.')) {
      throw new AppError(`Unsafe request field detected at ${path}.${key}`, 400)
    }
    inspectObject(value[key], `${path}.${key}`, state, depth + 1)
  }
}

const inspectQuery = (query) => {
  const entries = Object.entries(query || {})
  if (entries.length > 50) throw new AppError('Too many query parameters', 400)
  for (const [key, value] of entries) {
    if (dangerousKeys.has(key) || key.startsWith('$') || key.includes('.')) throw new AppError('Unsafe query parameter detected', 400)
    if (Array.isArray(value) || (value !== null && typeof value === 'object')) throw new AppError('Repeated or nested query parameters are not allowed', 400)
    if (String(value ?? '').length > 1000) throw new AppError('Query parameter is too long', 414)
  }
}

export function enforceRequestShape(request, _response, next) {
  try {
    if (request.originalUrl.length > 2048) throw new AppError('Request URL is too long', 414)
    inspectQuery(request.query)
    inspectObject(request.body, 'body', { nodes: 0 })

    const contentLength = Number(request.get('content-length') || 0)
    if (unsafeMethods.has(request.method) && contentLength > 0) {
      const contentType = String(request.get('content-type') || '').toLowerCase()
      if (!contentType.startsWith('application/json') && !contentType.startsWith('multipart/form-data')) {
        throw new AppError('Unsupported request content type', 415)
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}
