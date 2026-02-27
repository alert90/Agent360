import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { transactions } = req.body

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ message: 'Transactions array is required' })
    }

    const db = new Database('agent360.db')

    // Begin transaction for bulk insert
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
        // Find agent ID from account number
        const agentStmt = db.prepare('SELECT id FROM agents WHERE account_number = ?')
        const agent = agentStmt.get(txn.agentId) as { id: number } | undefined

        insertTransaction.run(
          txn.id,
          agent?.id || null,
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

    transaction(transactions)

    // Calculate commissions for the imported data
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const config = CommissionCalculationService.getDefaultConfig()

    // Get all transactions for commission calculation
    const allTransactions = db.prepare('SELECT * FROM transactions').all() as any[]

    // Create agent hierarchy and calculate commissions
    const calculations = CommissionCalculationService.processCommissionCalculations(
      allTransactions.map(t => ({
        id: t.transaction_id,
        agentId: t.agent_id,
        agentName: t.agent_name,
        customerName: t.customer_name,
        customerPhone: t.customer_phone,
        customerAccount: t.customer_account,
        type: t.type,
        amount: t.amount,
        fee: t.fee,
        netAmount: t.net_amount,
        commissionAmount: t.commission_amount,
        commissionEligible: t.commission_eligible === 1,
        status: t.status,
        location: t.location,
        zone: t.zone,
        channel: t.channel,
        narration: t.narration,
        reference: t.reference,
        initiatedBy: t.initiated_by,
        timestamp: t.timestamp
      })),
      config,
      period
    )

    // Store commission calculations
    const insertCommission = db.prepare(`
      INSERT OR REPLACE INTO commission_calculations (
        agent_id, agent_name, agent_type, period, total_amount,
        transaction_count, eligible_amount, commission_rate, commission_amount,
        payband, final_commission
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const commissionTransaction = db.transaction((calcs: any[]) => {
      for (const calc of calcs) {
        insertCommission.run(
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

    commissionTransaction(calculations.agentCalculations)

    db.close()

    return res.status(200).json({
      message: 'Transactions imported successfully',
      count: transactions.length,
      commissionCalculations: calculations.agentCalculations.length
    })
  } catch (error) {
    console.error('Import error:', error)

    return res.status(500).json({
      message: 'Import failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
