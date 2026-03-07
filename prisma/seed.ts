import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
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

async function main() {
  try {
    // Test connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful')

    // Check if users already exist
    const existingUsers = await prisma.user.count()

    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed...')

      return
    }

    // Hash passwords with bcrypt
    const saltRounds = 10

    // Create default users
    const defaultUsers = [
      {
        email: 'admin@cyberwiz.world',
        password: await bcrypt.hash('admin', saltRounds),
        fullName: 'Nicky Miles',
        username: 'ennexica',
        role: 'admin',
        permissions: JSON.stringify(['all']),
        location: 'Dar es Salaam',
        zone: 'Central',
        isActive: true,
        phoneNumber: null,
        address: null,
        zipCode: null,
        avatar: null
      },
      {
        email: 'analyst@cyberwiz.world',
        password: await bcrypt.hash('analyst', saltRounds),
        fullName: 'Data Analyst',
        username: 'analyst',
        role: 'analyst',
        permissions: JSON.stringify(['read', 'analyze', 'export']),
        location: 'Dar es Salaam',
        zone: 'Central',
        isActive: true,
        phoneNumber: null,
        address: null,
        zipCode: null,
        avatar: null
      },
      {
        email: 'sagent@cyberwiz.world',
        password: await bcrypt.hash('sagent', saltRounds),
        fullName: 'Super Agent John',
        username: 'sagent_john',
        role: 'super_agent',
        permissions: JSON.stringify(['manage_agents', 'view_reports', 'view_commissions']),
        location: 'Dar es Salaam',
        zone: 'Central',
        isActive: true,
        phoneNumber: null,
        address: null,
        zipCode: null,
        avatar: null
      },
      {
        email: 'franchise@cyberwiz.world',
        password: await bcrypt.hash('franchise', saltRounds),
        fullName: 'Franchise Mary',
        username: 'franchise_mary',
        role: 'franchise',
        permissions: JSON.stringify(['manage_agents', 'view_commissions', 'view_customers']),
        location: 'Arusha',
        zone: 'Northern',
        isActive: true,
        phoneNumber: null,
        address: null,
        zipCode: null,
        avatar: null
      }
    ]

    for (const user of defaultUsers) {
      await prisma.user.create({
        data: user
      })
    }

    console.log('Default users created successfully!')
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
