import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import 'dotenv/config'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// Create drizzle instance
export const db = drizzle(pool, { schema })

// Export schema tables
export {
  users,
  agents,
  transactions,
  commissionCalculations,
  superAgentKPIs,
  franchiseCalculations,
  commissionConfigs,
  commissionUserAssignments,
  faqCategories,
  faqQuestions,
  helpCenterCategories,
  helpCenterSubcategories,
  helpCenterArticles,
  popularArticles,
  keepLearningArticles,
  generalSettings,
  notificationSettings,
  notificationEvents,
  notificationRecipients,
  notificationLogs,
  userNotifications,
  agentAssignments,
  agentSuspensions,
  commissions,
  userLoginSessions,
  commissionSchedules,
  regionalManagerAssignments
} from './schema'

// Database connection helper
export const connectDB = async () => {
  try {
    const client = await pool.connect()
    client.release()
    console.log('Connected to PostgreSQL database')
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// Close database connection
export const closeDB = async () => {
  try {
    await pool.end()
    console.log('PostgreSQL connection closed')
  } catch (error) {
    console.error('Error closing database:', error)
  }
}

// Initialize database - creates default users if needed
export const initializeDatabase = async () => {
  try {
    console.log('PostgreSQL database ready - using Prisma for schema management')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

export default db
