import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if users already exist
  const existingUsers = await prisma.user.count()

  if (existingUsers > 0) {
    console.log('Users already exist, skipping seed...')

    return
  }

  // Hash passwords with bcrypt
  const saltRounds = 10

  // Create default users with hashed passwords
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
      isActive: 1
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
      isActive: 1
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
      isActive: true
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
      isActive: 1
    }
  ]

  for (const user of defaultUsers) {
    await prisma.user.create({
      data: user
    })
  }

  console.log('Default users created successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
