import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import Database from 'better-sqlite3'
import 'dotenv/config'

// Parse the connection string properly
const connectionString = process.env.DATABASE_URL

// Create pool with proper configuration
const pool = new pg.Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const sqlite = new Database('./agent360.db')

async function migrateData() {
  console.log('Starting data migration from SQLite to PostgreSQL...')

  try {
    // Test connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful')

    // ... rest of your migration code remains the same
    // (I'm keeping the rest as is from your previous version)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

migrateData()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
    sqlite.close()
  })
