import app from './app'
import { client } from './database'
import { logger } from './utils/logger'

const PORT = Bun.env.PORT || 3003

async function startServer() {
  try {
    await client`select 1`
   app.listen(PORT, ()=>console.log(`chat-service running on port ${PORT}`))
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
