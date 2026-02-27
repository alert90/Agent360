import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'
import { CSVImportServiceClient } from '../../../services/csvImportServiceClient'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period = new Date().toISOString().slice(0, 7), forceRecalculation = true } = req.body

    const db = new Database('agent360.db')

    // Check if commissions already exist for this period (unless force recalculation)
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

    // Step 1: Load and parse sample CSV file
    console.log('Step 1: Loading sample CSV file...')
    const csvPath = path.join(process.cwd(), 'Sample Report - Commission Automation_2025-12-04_14-51-37.csv')

    if (!fs.existsSync(csvPath)) {
      db.close()

      return res.status(400).json({
        message: 'Sample CSV file not found',
        path: csvPath
      })
    }

    const fileBuffer = fs.readFileSync(csvPath)
    const file = new File([new Uint8Array(fileBuffer)], 'sample-data.csv', { type: 'text/csv' })

    let importProgress = 0
    const importResult = await CSVImportServiceClient.importFromFile(file, progress => {
      importProgress = progress
      console.log(`CSV Import Progress: ${progress}%`)
    })

    if (!importResult.success || !importResult.data) {
      db.close()

      return res.status(400).json({
        message: 'Failed to parse CSV file',
        errors: importResult.errors
      })
    }

    console.log(`Step 1 Complete: Imported ${importResult.data.length} transactions`)

    // Step 2: Get active commission configuration
    console.log('Step 2: Loading commission configuration...')
    const configQuery = `
      SELECT * FROM commission_configs
      WHERE status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `

    const config = db.prepare(configQuery).get() as any

    if (!config) {
      db.close()

      return res.status(400).json({
        message: 'No active commission configuration found. Please create one first.',
        period
      })
    }

    console.log('Step 2 Complete: Configuration loaded')

    // Step 3: Prepare configuration object
    console.log('Step 3: Preparing calculation configuration...')
    const commissionConfig = {
      id: config.id,
      title: config.title,
      code: config.code,
      description: config.description,
      type: config.type,
      value: config.value,
      agentType: config.agent_type,
      status: config.status,
      startDate: new Date(config.start_date || Date.now()),
      endDate: new Date(config.end_date || Date.now()),
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

    console.log('Step 3 Complete: Configuration prepared')

    // Step 4: Convert transactions to expected format
    console.log('Step 4: Converting transaction data...')
    const formattedTransactions = importResult.data.map((t: any) => ({
      id: t.id,
      agentId: t.agentId,
      agentName: t.agentName,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      type: t.type,
      amount: Number(t.amount),
      fee: Number(t.fee),
      netAmount: Number(t.netAmount),
      commissionAmount: Number(t.commissionAmount),
      commissionEligible: t.commissionEligible,
      status: t.status,
      location: t.location,
      zone: t.zone,
      channel: t.channel,
      narration: t.narration,
      reference: t.reference,
      initiatedBy: t.initiatedBy,
      timestamp: t.timestamp
    }))

    console.log('Step 4 Complete: Transaction data converted')

    // Step 5: Calculate commissions with progress tracking
    console.log('Step 5: Calculating commissions...')
    let calculationProgress = 0
    const calculations = CommissionCalculationService.processCommissionCalculations(
      formattedTransactions,
      commissionConfig,
      period
    )

    calculationProgress = 100
    console.log(`Step 5 Complete: Calculated commissions for ${calculations.agentCalculations.length} agents`)

    // Step 6: Store results in database
    console.log('Step 6: Saving commission calculations to database...')

    // Delete existing calculations if force recalculation
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
    console.log('Step 6 Complete: Commission calculations saved')

    // Step 7: Calculate summary statistics
    console.log('Step 7: Calculating summary statistics...')
    const summary = {
      total_agents: calculations.agentCalculations.length,
      total_commission: calculations.agentCalculations.reduce(
        (sum: number, calc: any) => sum + calc.finalCommission,
        0
      ),
      total_amount: calculations.agentCalculations.reduce((sum: number, calc: any) => sum + calc.totalAmount, 0),
      total_transactions: calculations.agentCalculations.reduce(
        (sum: number, calc: any) => sum + calc.transactionCount,
        0
      ),
      period: period
    }

    console.log('Step 7 Complete: Summary calculated')

    db.close()

    return res.status(200).json({
      message: 'Commission calculation completed successfully from sample CSV',
      period,
      summary,
      calculations_processed: calculations.agentCalculations.length,
      transactions_processed: formattedTransactions.length,
      config_used: {
        id: config.id,
        title: config.title,
        code: config.code
      },
      report_url: `/commission/report?period=${period}`,
      redirect: true,
      progress: {
        csv_import: 100,
        data_preparation: 100,
        calculation: 100,
        database_save: 100,
        summary: 100
      }
    })
  } catch (error) {
    console.error('Sample CSV calculation error:', error)

    return res.status(500).json({
      message: 'Failed to calculate commissions from sample CSV',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
