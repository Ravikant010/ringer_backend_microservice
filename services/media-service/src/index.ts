import 'dotenv/config'
import fs from 'fs'
import app from './app'
import { client } from './database'

const PORT = Number(Bun.env.PORT ?? 3005)

async function start() {
  try {
    // Ensure storage directory exists
    const storagePath = Bun.env.MEDIA_STORAGE_PATH || 'storage/media'
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true })
    }

    await client`select 1`
    app.listen(PORT, () => {
      console.log(`media-service running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start media-service', err)
    process.exit(1)
  }
}

start()
