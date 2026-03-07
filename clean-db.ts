import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

async function cleanDatabase() {
  const connectionString = process.env.DATABASE_URL
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('Cleaning database...')

    // Delete in correct order
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.commission.deleteMany(),
      prisma.agentAssignment.deleteMany(),
      prisma.agentSuspension.deleteMany(),
      prisma.agent.deleteMany()
    ])

    console.log('✅ Database cleaned successfully')

    // Verify
    const agentCount = await prisma.agent.count()
    const txCount = await prisma.transaction.count()
    console.log(`Agents: ${agentCount}, Transactions: ${txCount}`)
  } catch (error) {
    console.error('Clean failed:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

cleanDatabase()
