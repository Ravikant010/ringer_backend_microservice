import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

import { dot } from 'node:test/reporters'

if (!Bun.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

const connectionString = Bun.env.DATABASE_URL
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
export type Database = typeof db

// Health check function
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
