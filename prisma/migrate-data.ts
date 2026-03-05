import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import 'dotenv/config'

const prisma = new PrismaClient()
const sqlite = new Database('./agent360.db')

async function migrateData() {
  console.log('Starting data migration from SQLite to PostgreSQL...')

  // Migrate Users
  console.log('Migrating users...')
  const users = sqlite.prepare('SELECT * FROM users').all()
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        password: user.password,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        location: user.location,
        zone: user.zone,
        isActive: user.is_active === 1,
        phoneNumber: user.phone_number,
        address: user.address,
        zipCode: user.zip_code,
        avatar: user.avatar,
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
      }
    })
  }
  console.log(`Migrated ${users.length} users`)

  // Migrate Agents
  console.log('Migrating agents...')
  const agents = sqlite.prepare('SELECT * FROM agents').all()
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {},
      create: {
        id: agent.id,
        accountNumber: agent.account_number,
        name: agent.name,
        type: agent.type,
        branchCode: agent.branch_code,
        branchName: agent.branch_name,
        parentAgentId: agent.parent_agent_id,
        isActive: agent.is_active,
        commissionEligible: agent.commission_eligible,
        totalTransactionAmount: agent.total_transaction_amount || 0,
        transactionCount: agent.transaction_count || 0,
        commissionAmount: agent.commission_amount || 0,
        payband: agent.payband || 1.0,
        createdAt: agent.created_at ? new Date(agent.created_at) : new Date(),
        updatedAt: agent.updated_at ? new Date(agent.updated_at) : new Date(),
        username: agent.username,
        email: agent.email,
        phone: agent.phone,
        contact: agent.contact,
        role: agent.role,
        region: agent.region,
        zone: agent.zone
      }
    })
  }
  console.log(`Migrated ${agents.length} agents`)

  // Migrate Transactions (batch for performance)
  console.log('Migrating transactions (this may take a while)...')
  const transactions = sqlite.prepare('SELECT * FROM transactions').all()
  let count = 0
  const batchSize = 1000

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    await prisma.transaction.createMany({
      data: batch.map((t: any) => ({
        id: t.id,
        transactionId: t.transaction_id,
        agentId: t.agent_id,
        agentName: t.agent_name,
        customerName: t.customer_name,
        customerPhone: t.customer_phone,
        customerAccount: t.customer_account,
        type: t.type,
        amount: t.amount,
        fee: t.fee || 0,
        netAmount: t.net_amount,
        commissionAmount: t.commission_amount || 0,
        commissionEligible: t.commission_eligible,
        status: t.status || 'pending',
        location: t.location,
        zone: t.zone,
        channel: t.channel,
        narration: t.narration,
        reference: t.reference,
        initiatedBy: t.initiated_by || 'customer',
        timestamp: t.timestamp ? new Date(t.timestamp) : new Date(),
        createdAt: t.created_at ? new Date(t.created_at) : new Date()
      })),
      skipDuplicates: true
    })
    count += batch.length
    console.log(`Migrated ${count}/${transactions.length} transactions...`)
  }
  console.log('Transactions migration complete')

  // Migrate Commission Configs
  console.log('Migrating commission configs...')
  const commissionConfigs = sqlite.prepare('SELECT * FROM commission_configs').all()
  for (const config of commissionConfigs) {
    await prisma.commissionConfig.upsert({
      where: { id: config.id },
      update: {},
      create: {
        id: config.id,
        title: config.title,
        code: config.code,
        description: config.description,
        type: config.type,
        value: config.value,
        agentType: config.agent_type,
        status: config.status || 'active',
        startDate: config.start_date,
        endDate: config.end_date,
        minTransactionAmount: config.min_transaction_amount || 100000,
        commissionRate: config.commission_rate || 0.05,
        paybandFee: config.payband_fee || 0,
        superAgentCommissionRate: config.super_agent_commission_rate || 0.2,
        superAgentFixedRate: config.super_agent_fixed_rate || 0.06,
        superAgentVariableRate: config.super_agent_variable_rate || 0.14,
        franchiseMultiplier: config.franchise_multiplier || 4.5,
        kpiWeights: config.kpi_weights,
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }
    })
  }
  console.log(`Migrated ${commissionConfigs.length} commission configs`)

  // Migrate other tables as needed...
  console.log('Migration completed successfully!')
}

migrateData()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    sqlite.close()
  })
