import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import { CSVImportService } from '../../../services/csvImportService'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { filePath, period = new Date().toISOString().slice(0, 7), forceRecalculation = true } = req.body

    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' })
    }

    const db = new Database('agent360.db')

    // Get active commission configuration
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

    // Prepare configuration object
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

    console.log(`Starting streaming import for ${filePath}`)

    // Set up streaming import with batch processing
    let processedBatches = 0
    let totalTransactions = 0

    const result = await CSVImportService.streamImportFromPath(filePath, {
      chunkSize: 2 * 1024 * 1024, // 2MB chunks for better performance
      batchSize: 5000, // Process in smaller batches for memory efficiency

      onProgress: progress => {
        console.log(`Streaming progress: ${progress.percentage.toFixed(2)}% (${progress.processed} rows processed)`)
      },

      onBatchComplete: async (batch, batchIndex) => {
        processedBatches++
        totalTransactions += batch.length

        console.log(`Processing batch ${batchIndex + 1}: ${batch.length} transactions`)

        try {
          // Convert batch to transaction format
          const batchTransactions = CSVImportService.convertToTransactionType(batch)

          // Store batch in database immediately
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

          transaction(batchTransactions)

          // Calculate commissions for this batch
          const batchCalculations = CommissionCalculationService.processCommissionCalculations(
            batchTransactions,
            commissionConfig,
            period
          )

          // Store commission calculations
          const insertCalculation = db.prepare(`
            INSERT OR REPLACE INTO commission_calculations (
              agent_id, agent_name, agent_type, period, total_amount,
              transaction_count, eligible_amount, commission_rate, commission_amount,
              payband, final_commission, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)

          const commissionTransaction = db.transaction((calcs: any[]) => {
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

          commissionTransaction(batchCalculations.agentCalculations)

          console.log(
            `Batch ${batchIndex + 1} completed: ${batchTransactions.length} transactions, ${
              batchCalculations.agentCalculations.length
            } commission calculations`
          )
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error)
          throw error
        }
      }
    })

    // Calculate final summary statistics
    const summary = {
      total_transactions: totalTransactions,
      processed_batches: processedBatches,
      file_size: result.stats?.totalFileSize || 0,
      streaming_method: true,
      period: period,
      config_used: {
        id: config.id,
        title: config.title,
        code: config.code
      }
    }

    db.close()

    return res.status(200).json({
      message: 'Streaming CSV import and commission calculation completed successfully',
      summary,
      import_result: {
        success: result.success,
        errors: result.errors,
        stats: result.stats
      }
    })
  } catch (error) {
    console.error('Streaming import error:', error)

    return res.status(500).json({
      message: 'Streaming import failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
