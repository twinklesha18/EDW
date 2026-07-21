export const paginationFromQuery = (query, { defaultLimit = 12, maxLimit = 100 } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

export const paginationData = (total, page, limit) => ({ total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total, hasPreviousPage: page > 1 })

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
