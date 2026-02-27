import { connectDB } from './db'
import authService from '../services/authService'
import { CSVImportServiceClient } from '../services/csvImportServiceClient'
import { CommissionCalculationService } from '../services/commissionCalculationService'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export const initializeDatabase = async () => {
  try {
    // Connect to database
    await connectDB()

    // Create default users if they don't exist
    await authService.createDefaultUsers()

    // Import CSV data if database is empty
    await importCSVData()

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

const importCSVData = async () => {
  try {
    const db = new Database('agent360.db')

    // Check if transactions table has data
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }

    if (transactionCount.count > 0) {
      console.log('Database already has transaction data, skipping CSV import')
      db.close()

      return
    }

    // Import CSV file
    const csvPath = path.join(process.cwd(), 'Sample Report - Commission Automation_2025-12-04_14-51-37.csv')

    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found, skipping import')
      db.close()

      return
    }

    console.log('Importing CSV data...')

    const fileBuffer = fs.readFileSync(csvPath)
    const file = new File([new Uint8Array(fileBuffer)], 'sample-data.csv', { type: 'text/csv' })

    const result = await CSVImportServiceClient.importFromFile(file, progress => {
      console.log(`Import progress: ${progress}%`)
    })

    if (result.success && result.data) {
      console.log(`Successfully imported ${result.data.length} transactions`)

      // Import transactions directly to database
      const insertTransaction = db.prepare(`
        INSERT OR REPLACE INTO transactions (
          transaction_id, agent_id, agent_name, customer_name, customer_phone,
          customer_account, type, amount, fee, net_amount, commission_amount,
          commission_eligible, status, location, zone, channel, narration,
          reference, initiated_by, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = db.transaction((txns: any[]) => {
        for (const txn of txns) {
          insertTransaction.run(
            txn.id,
            txn.agentId,
            txn.agentName,
            txn.customerName,
            txn.customerPhone,
            txn.customerAccount,
            txn.type,
            txn.amount,
            txn.fee,
            txn.netAmount,
            txn.commissionAmount,
            txn.commissionEligible ? 1 : 0,
            txn.status,
            txn.location,
            txn.zone,
            txn.channel,
            txn.narration,
            txn.reference,
            txn.initiatedBy,
            txn.timestamp
          )
        }
      })

      transaction(result.data)
      console.log('Transactions imported to database successfully')

      // Calculate initial commissions
      await calculateInitialCommissions(db, result.data)
    } else {
      console.error('CSV import failed:', result.errors)
    }

    db.close()
  } catch (error) {
    console.error('CSV import error:', error)
  }
}

const calculateInitialCommissions = async (db: Database.Database, transactions: any[]) => {
  try {
    const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM
    const config = CommissionCalculationService.getDefaultConfig()

    // Calculate commissions
    const calculations = CommissionCalculationService.processCommissionCalculations(transactions, config, currentPeriod)

    // Store commission calculations in database
    const insertCalculation = db.prepare(`
      INSERT OR REPLACE INTO commission_calculations (
        agent_id, agent_name, agent_type, period, total_amount,
        transaction_count, eligible_amount, commission_rate, commission_amount,
        payband, final_commission, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)

    const transaction = db.transaction((calcs: any[]) => {
      for (const calc of calcs) {
        insertCalculation.run(
          calc.agentId,
          calc.agentName,
          calc.agentType,
          calc.period,
          calc.totalAmount,
          calc.transactionCount,
          calc.eligibleAmount,
          calc.commissionRate,
          calc.commissionAmount,
          calc.payband,
          calc.finalCommission
        )
      }
    })

    transaction(calculations.agentCalculations)
    console.log(`Calculated commissions for ${calculations.agentCalculations.length} agents`)
  } catch (error) {
    console.error('Commission calculation error:', error)
  }
}

// Removed auto-initialization to prevent client-side database calls

export default initializeDatabase
