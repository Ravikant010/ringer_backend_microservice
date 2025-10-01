import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'path'

// Load environment variables
// dotenv.config({ path: path.resolve(__dirname, '../../.env') })

if (!Bun.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables')
  process.exit(1)
}

const connectionString = Bun.env.DATABASE_URL
const migrationClient = postgres(connectionString, { max: 1 })
const db = drizzle(migrationClient)

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...')
    
    await migrate(db, { migrationsFolder: './drizzle' })
    
    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await migrationClient.end()
  }
}

export {runMigrations}
