import { NextApiRequest, NextApiResponse } from 'next/types'
import { LargeCSVImportService } from '../../../services/largeCSVImportService'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'
import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

// Global instance to persist across requests
let importService: LargeCSVImportService | null = null

function getImportService(): LargeCSVImportService {
  if (!importService) {
    importService = new LargeCSVImportService('agent360.db')

    // Set up event listeners for progress tracking
    importService.on('progress', progress => {
      console.log(
        `Import progress: ${progress.stage} - ${progress.progress.toFixed(2)}% (${progress.processedRows}/${
          progress.totalRows
        })`
      )
    })

    importService.on('error', error => {
      console.error('Import service error:', error)
    })

    // Start directory monitoring for automatic imports
    importService.startDirectoryMonitoring()
  }

  return importService
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleLargeImport(req, res)
  } else if (req.method === 'GET') {
    return handleImportStatus(req, res)
  } else if (req.method === 'DELETE') {
    return handleCacheManagement(req, res)
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'DELETE'])

    return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function handleLargeImport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { filePath, options, period, calculateCommissions = true } = req.body

    if (!filePath) {
      return res.status(400).json({
        message: 'File path is required',
        example: {
          filePath: './Sample Report - Commission Automation_2025-12-04_14-51-37.csv',
          options: {
            chunkSize: 4 * 1024 * 1024, // 4MB
            batchSize: 10000,
            enableCaching: true,
            enableIndexing: true
          },
          period: '2025-12',
          calculateCommissions: true
        }
      })
    }

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File not found',
        filePath,
        availableFiles: getAvailableCSVFiles()
      })
    }

    const service = getImportService()

    // Check if already processing
    if (service.isCurrentlyProcessing()) {
      return res.status(409).json({
        message: 'Another import is already in progress',
        progress: service.getImportProgress()
      })
    }

    console.log(`Starting large CSV import for: ${filePath}`)

    // Start the import process
    const importPromise = service.importLargeCSV(filePath, options, period)

    // Set up progress tracking
    let hasResponded = false

    const progressHandler = (progress: any) => {
      if (!hasResponded && (progress.stage === 'processing' || progress.stage === 'completed')) {
        // Send progress update for long-running imports
        if (progress.progress % 10 === 0 || progress.stage === 'completed') {
          console.log(`Progress update: ${progress.progress.toFixed(2)}%`)
        }
      }
    }

    service.on('progress', progressHandler)

    try {
      const result = await importPromise

      if (calculateCommissions && result.success) {
        console.log('Starting commission calculations...')
        await calculateCommissionsForPeriod(period || new Date().toISOString().slice(0, 7))
      }

      hasResponded = true
      service.off('progress', progressHandler)

      return res.status(200).json({
        message: 'Large CSV import completed successfully',
        result,
        performance: {
          processingTime: result.stats?.processingTime,
          averageRate: result.stats?.processedTransactions
            ? (result.stats.processedTransactions / (result.stats.processingTime || 1)).toFixed(2)
            : 0,
          memoryUsage: process.memoryUsage(),
          cacheHit: result.stats?.cached || false
        }
      })
    } catch (error) {
      hasResponded = true
      service.off('progress', progressHandler)

      console.error('Large import failed:', error)

      return res.status(500).json({
        message: 'Large CSV import failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
    }
  } catch (error) {
    console.error('Import handler error:', error)

    return res.status(500).json({
      message: 'Import handler failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleImportStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const service = getImportService()

    const { action } = req.query

    switch (action) {
      case 'progress':
        return res.status(200).json({
          isProcessing: service.isCurrentlyProcessing(),
          progress: service.getImportProgress()
        })

      case 'cache':
        return res.status(200).json({
          cache: service.getCacheMetadata(),
          cacheSize: service.getCacheMetadata().length
        })

      case 'files':
        return res.status(200).json({
          availableFiles: getAvailableCSVFiles(),
          cacheFiles: service.getCacheMetadata().map(c => c.fileName)
        })

      case 'optimize':
        service.optimizeDatabase()

        return res.status(200).json({ message: 'Database optimization completed' })

      default:
        return res.status(200).json({
          isProcessing: service.isCurrentlyProcessing(),
          progress: service.getImportProgress(),
          cache: service.getCacheMetadata(),
          availableFiles: getAvailableCSVFiles()
        })
    }
  } catch (error) {
    console.error('Status handler error:', error)

    return res.status(500).json({
      message: 'Status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleCacheManagement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const service = getImportService()
    const { action, maxAge } = req.query

    switch (action) {
      case 'clear':
        service.clearCache()

        return res.status(200).json({ message: 'Cache cleared successfully' })

      case 'expired':
        const age = maxAge ? parseInt(maxAge as string) : undefined
        service.clearExpiredCache(age)

        return res.status(200).json({ message: 'Expired cache cleared' })

      default:
        return res.status(400).json({
          message: 'Invalid action',
          validActions: ['clear', 'expired']
        })
    }
  } catch (error) {
    console.error('Cache management error:', error)

    return res.status(500).json({
      message: 'Cache management failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function calculateCommissionsForPeriod(period: string) {
  const db = new Database('agent360.db')

  try {
    // Get active commission configuration
    const configQuery = `
      SELECT * FROM commission_configs
      WHERE status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `

    const config = db.prepare(configQuery).get() as any

    if (!config) {
      console.warn('No active commission configuration found')

      return
    }

    // Get all transactions for the period
    const transactionsQuery = `
      SELECT * FROM transactions
      WHERE strftime('%Y-%m', timestamp) = ?
      ORDER BY timestamp
    `

    const transactions = db.prepare(transactionsQuery).all(period)

    console.log(`Calculating commissions for ${transactions.length} transactions in period ${period}`)

    // Convert to transaction format and calculate commissions
    const results = CommissionCalculationService.processCommissionCalculations(
      transactions as any[],
      {
        id: config.id,
        title: config.title,
        code: config.code,
        type: config.type,
        value: config.value,
        agentType: config.agent_type,
        minTransactionAmount: config.min_transaction_amount,
        commissionRate: config.commission_rate,
        superAgentCommissionRate: config.super_agent_commission_rate,
        superAgentFixedRate: config.super_agent_fixed_rate,
        superAgentVariableRate: config.super_agent_variable_rate,
        franchiseMultiplier: config.franchise_multiplier,
        kpiWeights: JSON.parse(config.kpi_weights || '{}')
      },
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

    transaction(results.agentCalculations)

    console.log(`Commission calculations completed for ${results.agentCalculations.length} agents`)
  } finally {
    db.close()
  }
}

function getAvailableCSVFiles(): string[] {
  const directories = ['./', './data/commissions', './uploads']
  const csvFiles: string[] = []

  directories.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter(file => file.toLowerCase().endsWith('.csv'))
          .map(file => path.join(dir, file))
        csvFiles.push(...files)
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error)
    }
  })

  return csvFiles
}

// Export for testing
export { getImportService, calculateCommissionsForPeriod }
