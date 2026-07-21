import { Router } from 'express'
import { getDashboardAnalytics } from '../controllers/dashboardController.js'
import { globalSearch } from '../controllers/searchController.js'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import adminBannerRoutes from './adminBannerRoutes.js'
import adminCategoryRoutes from './adminCategoryRoutes.js'
import adminCouponRoutes from './adminCouponRoutes.js'
import adminOrderRoutes from './adminOrderRoutes.js'
import adminProductRoutes from './adminProductRoutes.js'
import adminReviewRoutes from './adminReviewRoutes.js'
import adminUploadRoutes from './adminUploadRoutes.js'
import adminUserRoutes from './adminUserRoutes.js'
import adminCustomOrderRoutes from './adminCustomOrderRoutes.js'
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
router.use('/coupons', adminCouponRoutes)
router.use('/banners', adminBannerRoutes)
router.use('/uploads', adminUploadRoutes)
export default router
