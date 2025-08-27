import { Request, Response } from 'express'
import { analyticsRepository } from '../repo/analytics.repository'
import { 
  IngestEventSchema, 
  DashboardQuerySchema, 
  TimeSeriesQuerySchema,
  UserActivityQuerySchema 
} from '../validation/analytics.schemas'

export class AnalyticsController {
  // Internal endpoint for other services to report events
  async ingestEvent(req: Request, res: Response) {
    try {
      const params = IngestEventSchema.parse(req.body)
      const event = await analyticsRepository.recordEvent({
        ...params,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
      res.status(201).json({ success: true, data: { eventId: event.id } })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'INGEST_EVENT_FAILED' })
    }
  }

  // Dashboard summary metrics
  async getDashboard(req: Request, res: Response) {
    try {
      const { startDate, endDate } = DashboardQuerySchema.parse(req.query)
      const metrics = await analyticsRepository.getDashboardMetrics(startDate, endDate)
      
      res.json({ 
        success: true, 
        data: { 
          ...metrics, 
          period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
        } 
      })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'DASHBOARD_QUERY_FAILED' })
    }
  }

  // Time-series data for charts
  async getTimeSeries(req: Request, res: Response) {
    try {
      const { eventType, startDate, endDate, groupBy } = TimeSeriesQuerySchema.parse(req.query)
      const series = await analyticsRepository.getEventTimeSeries(eventType, startDate, endDate, groupBy)
      
      res.json({ success: true, data: { series, eventType, groupBy } })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'TIMESERIES_QUERY_FAILED' })
    }
  }

  // User activity insights
  async getUserActivity(req: Request, res: Response) {
    try {
      const { startDate, endDate, userId } = UserActivityQuerySchema.parse(req.query)
      const activity = await analyticsRepository.getUserActivity(startDate, endDate, userId)
      
      res.json({ success: true, data: activity })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'USER_ACTIVITY_FAILED' })
    }
  }

  // User retention metrics
  async getRetention(req: Request, res: Response) {
    try {
      const { startDate, endDate } = DashboardQuerySchema.parse(req.query)
      const retention = await analyticsRepository.getUserRetention(startDate, endDate)
      
      res.json({ success: true, data: retention })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'RETENTION_QUERY_FAILED' })
    }
  }

  // Top performing content
  async getTopContent(req: Request, res: Response) {
    try {
      const { startDate, endDate } = DashboardQuerySchema.parse(req.query)
      const entityType = req.query.entityType as string || 'post'
      const limit = Number(req.query.limit) || 10
      
      const topContent = await analyticsRepository.getTopContent(startDate, endDate, entityType, limit)
      
      res.json({ success: true, data: topContent })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'TOP_CONTENT_FAILED' })
    }
  }
}

export const analyticsController = new AnalyticsController()
