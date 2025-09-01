import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import searchRoutes from './routes/search.routes'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: Bun.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'search-service', timestamp: new Date().toISOString() })
})

app.use('/api/v1/search', searchRoutes)

// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, error: 'Route not found', code: 'ROUTE_NOT_FOUND' })
// })

export default app
