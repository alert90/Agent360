import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)

// Create PrismaClient with the adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export prisma as db for backward compatibility
export { prisma as db }

// Re-export table models for backward compatibility
export const users = () => prisma.user
export const agents = () => prisma.agent
export const transactions = () => prisma.transaction
export const commissions = () => prisma.commission
export const commissionConfigs = () => prisma.commissionConfig
export const agentAssignments = () => prisma.agentAssignment
export const superAgentKPIs = () => prisma.superAgentKPI
export const franchisePerformances = () => prisma.franchisePerformance
export const capitalAdvanced = () => prisma.capitalAdvanced

// Connection functions
export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)

    return false
  }
}

export const closeDB = async () => {
  await prisma.$disconnect()
  console.log('Database disconnected')
}

export default prisma
