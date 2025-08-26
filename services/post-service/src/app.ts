import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import postRoutes from './routes/post.routes'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'post-service', timestamp: new Date().toISOString() })
})

app.use('/api/v1', postRoutes)



export default app
