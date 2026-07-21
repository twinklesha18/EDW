export function notFound(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
    errors: [],
  })
}

export function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || (response.statusCode >= 400 ? response.statusCode : 500)
  let message = error.message || 'Internal server error'
  let errors = error.errors || []

  if (error.name === 'ValidationError') {
    statusCode = 422
    message = 'Validation failed'
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
  } else if (error.code === 11000) {
    statusCode = 409
    const field = Object.keys(error.keyPattern || {})[0] || 'value'
    message = `${field.charAt(0).toUpperCase()}${field.slice(1)} is already in use`
    errors = [{ field, message }]
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid resource identifier'
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Your session is invalid or has expired'
  } else if (error.name === 'MulterError') {
    statusCode = 422
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 12 MB' : 'Invalid image upload'
  }

  response.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  })
}
