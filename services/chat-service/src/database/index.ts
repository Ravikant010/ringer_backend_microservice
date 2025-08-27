import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import './relation'

const connectionString = Bun.env.DATABASE_URL!
export const client = postgres(connectionString, { max: 10 })
export const db = drizzle(client, { schema: { ...schema }, logger: true })
