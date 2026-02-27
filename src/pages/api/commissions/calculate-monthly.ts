import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, forceRecalculation = false } = req.body

    if (!period || typeof period !== 'string') {
      return res.status(400).json({ message: 'Period parameter is required (YYYY-MM format)' })
    }

    const db = new Database('agent360.db')

    // Check if commissions already exist for this period
    if (!forceRecalculation) {
      const existingCommissions = db
        .prepare('SELECT COUNT(*) as count FROM commission_calculations WHERE period = ?')
        .get(period) as any
      if (existingCommissions.count > 0) {
        db.close()

        return res.status(200).json({
          message: 'Commissions already calculated for this period',
          period,
          existing_calculations: existingCommissions.count
        })
      }
    }

    // Get all transactions for the specified period
    const periodStart = `${period}-01`
    const periodEnd = new Date(new Date(periodStart).getFullYear(), new Date(periodStart).getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const transactionsQuery = `
      SELECT t.*,
             a.account_number,
             a.name as agent_name,
             a.type as agent_type,
             a.branch_name,
             a.parent_agent_id
      FROM transactions t
      LEFT JOIN agents a ON t.agent_id = a.id
      WHERE t.timestamp >= ? AND t.timestamp <= ?
      ORDER BY t.timestamp ASC
    `

    const transactions = db.prepare(transactionsQuery).all(periodStart + ' 00:00:00', periodEnd + ' 23:59:59') as any[]

    if (transactions.length === 0) {
      db.close()

      return res.status(200).json({
        message: 'No transactions found for the specified period',
        period,
        transactions_found: 0
      })
    }

    // Get active commission configuration
    const configQuery = `
      SELECT * FROM commission_configs
      WHERE status = 'active'
      AND start_date <= ?
      AND end_date >= ?
      ORDER BY created_at DESC LIMIT 1
    `

    const config = db.prepare(configQuery).get(periodEnd, periodStart) as any

    if (!config) {
      db.close()

      return res.status(400).json({
        message: 'No active commission configuration found for this period',
        period
      })
    }

    // Prepare configuration object for calculation service
    const commissionConfig = {
      id: config.id,
      title: config.title,
      code: config.code,
      description: config.description,
      type: config.type,
      value: config.value,
      agentType: config.agent_type,
      status: config.status,
      startDate: new Date(config.start_date),
      endDate: new Date(config.end_date),
      minTransactionAmount: config.min_transaction_amount,
      maxTransactions: config.max_transactions,
      commissionRate: config.commission_rate,
      paybandFee: config.payband_fee || 0,
      superAgentCommissionRate: config.super_agent_commission_rate,
      superAgentFixedRate: config.super_agent_fixed_rate,
      superAgentVariableRate: config.super_agent_variable_rate,
      franchiseMultiplier: config.franchise_multiplier,
      kpiWeights: JSON.parse(config.kpi_weights || '{}'),
      createdAt: new Date(config.created_at),
      updatedAt: new Date(config.updated_at)
    }

    // Convert transactions to expected format
    const formattedTransactions = transactions.map(t => ({
      id: t.transaction_id,
      agentId: t.agent_id?.toString() || t.agent_id,
      agentName: t.agent_name || 'Unknown Agent',
      customerName: t.customer_name,
      customerPhone: t.customer_phone,
      type: t.type,
      amount: Number(t.amount),
      fee: Number(t.fee),
      netAmount: Number(t.net_amount),
      commissionAmount: Number(t.commission_amount),
      commissionEligible: t.commission_eligible === 1,
      status: t.status,
      location: t.location,
      zone: t.zone,
      channel: t.channel,
      narration: t.narration,
      reference: t.reference,
      initiatedBy: t.initiated_by,
      timestamp: t.timestamp
    }))

    // Calculate commissions
    const calculations = CommissionCalculationService.processCommissionCalculations(
      formattedTransactions,
      commissionConfig,
      period
    )

    // Store commission calculations in database (delete existing first if force recalculation)
    if (forceRecalculation) {
      db.prepare('DELETE FROM commission_calculations WHERE period = ?').run(period)
    }

    const insertCalculation = db.prepare(`
      INSERT INTO commission_calculations (
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

    // Calculate summary statistics
    const summary = {
      total_agents: calculations.agentCalculations.length,
      total_commission: calculations.agentCalculations.reduce((sum, calc) => sum + calc.finalCommission, 0),
      total_amount: calculations.agentCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0),
      total_transactions: calculations.agentCalculations.reduce((sum, calc) => sum + calc.transactionCount, 0)
    }

    db.close()

    return res.status(200).json({
      message: 'Monthly commissions calculated successfully',
      period,
      summary,
      calculations_processed: calculations.agentCalculations.length,
      transactions_processed: transactions.length,
      config_used: {
        id: config.id,
        title: config.title,
        code: config.code
      },
      report_url: `/commission/report?period=${period}`,
      redirect: true
    })
  } catch (error) {
    console.error('Monthly commission calculation error:', error)

    return res.status(500).json({
      message: 'Failed to calculate monthly commissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
