import { Router } from 'express'
import { getDashboardAnalytics } from '../controllers/dashboardController.js'
import { globalSearch } from '../controllers/searchController.js'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import adminBannerRoutes from './adminBannerRoutes.js'
import adminCategoryRoutes from './adminCategoryRoutes.js'
import adminOrderRoutes from './adminOrderRoutes.js'
import adminProductRoutes from './adminProductRoutes.js'
import adminReviewRoutes from './adminReviewRoutes.js'
import adminUploadRoutes from './adminUploadRoutes.js'
import adminUserRoutes from './adminUserRoutes.js'
import adminCustomOrderRoutes from './adminCustomOrderRoutes.js'
import adminSettingsRoutes from './adminSettingsRoutes.js'
import adminUserDeletionLogRoutes from './adminUserDeletionLogRoutes.js'
const router = Router()
router.use(protect, authorizeRoles('admin'))
router.get('/dashboard', getDashboardAnalytics)
router.get('/search', globalSearch)
router.use('/products', adminProductRoutes)
router.use('/categories', adminCategoryRoutes)
router.use('/orders', adminOrderRoutes)
router.use('/custom-orders', adminCustomOrderRoutes)
router.use('/users', adminUserRoutes)
router.use('/reviews', adminReviewRoutes)
router.use('/banners', adminBannerRoutes)
router.use('/uploads', adminUploadRoutes)
router.use('/settings', adminSettingsRoutes)
router.use('/user-deletion-logs', adminUserDeletionLogRoutes)
export default router
