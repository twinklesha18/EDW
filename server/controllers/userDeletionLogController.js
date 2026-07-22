import UserDeletionLog from '../models/UserDeletionLog.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { sendSuccess } from '../utils/responseUtils.js'

export async function listUserDeletionLogs(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 12, maxLimit: 50 })
  const filter = {}
  if (request.query.status) filter.status = request.query.status
  if (request.query.search) {
    const pattern = new RegExp(escapeRegex(String(request.query.search).slice(0, 160)), 'i')
    filter.$or = [
      { 'deletedUser.name': pattern }, { 'deletedUser.email': pattern },
      { 'performedBySnapshot.name': pattern }, { 'performedBySnapshot.email': pattern },
      { orderNumbers: pattern }, { customOrderNumbers: pattern },
    ]
  }
  const [logs, total] = await Promise.all([
    UserDeletionLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserDeletionLog.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'User deletion logs retrieved', data: { logs, pagination: paginationData(total, page, limit) } })
}
