// Use Prisma database for production-ready system with better performance
export { prisma as db } from './prisma'

// Re-export table models for backward compatibility
export const users = () => prisma.user
export const agents = () => prisma.agent
export const transactions = () => prisma.transaction
export const commissionCalculations = () => prisma.commissionCalculation
export const superAgentKPIs = () => prisma.superAgentKPI
export const franchiseCalculations = () => prisma.franchiseCalculation
export const commissionConfigs = () => prisma.commissionConfig

// Connection functions for compatibility
export const connectDB = async () => {
  // Prisma manages connections automatically
  return true
}

export const closeDB = async () => {
  await prisma.$disconnect()
}

// Import Prisma client
import { prisma } from './prisma'
