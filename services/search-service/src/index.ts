
import app from './app'
import { client } from './database'

const PORT = Number(Bun.env.PORT ?? 3008)

async function start() {
  try {
    await client`select 1`
    app.listen(PORT, () => {
      console.log(`search-service running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start search-service', err)
    process.exit(1)
  }
}

start()
