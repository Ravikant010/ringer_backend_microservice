import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import mediaRoutes from './routes/media.routes'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '2mb' }))

// Serve static files
const mediaPath = process.env.MEDIA_STORAGE_PATH || 'storage/media'
app.use('/files', express.static(path.resolve(mediaPath)))

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'media-service', timestamp: new Date().toISOString() })
})

app.use('/api/v1', mediaRoutes)

// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, error: 'Route not found', code: 'ROUTE_NOT_FOUND' })
// })

export default app
