import { Router } from 'express'
import { analyticsController } from '../controllers/analytics.controller'

const router = Router()

// Internal ingestion endpoint (could be protected with service-to-service auth)
router.post('/events', analyticsController.ingestEvent.bind(analyticsController))

// Dashboard/reporting endpoints (should be protected with admin auth)
router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController))
router.get('/timeseries', analyticsController.getTimeSeries.bind(analyticsController))
router.get('/users/activity', analyticsController.getUserActivity.bind(analyticsController))
router.get('/users/retention', analyticsController.getRetention.bind(analyticsController))
router.get('/content/top', analyticsController.getTopContent.bind(analyticsController))

export default router
