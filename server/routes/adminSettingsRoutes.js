import { Router } from 'express'
import { createSiteSettings, deleteSiteSettings, getAdminSiteSettings, updateSiteSettings } from '../controllers/siteSettingsController.js'
import { validateSiteSettings } from '../middleware/siteSettingsValidateMiddleware.js'

const router = Router()
router.get('/', getAdminSiteSettings)
router.post('/', validateSiteSettings, createSiteSettings)
router.put('/', validateSiteSettings, updateSiteSettings)
router.delete('/', deleteSiteSettings)
export default router
