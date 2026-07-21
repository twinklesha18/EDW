export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export function sendSuccess(response, { statusCode = 200, message, data = {} }) {
  return response.status(statusCode).json({ success: true, message, data })
}
