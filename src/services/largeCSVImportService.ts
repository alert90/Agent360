import { CSVImportService, ImportResult } from './csvImportService'
import { CSVTransactionRow } from '../types/apps/commissionTypes'
import { TransactionType } from '../types/apps/transactionsTypes'
import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import { EventEmitter } from 'events'

export interface LargeImportOptions {3
  chunkSize?: number
  batchSize?: number
  maxMemoryUsage?: number // MB
  enableCaching?: boolean
  cacheDirectory?: string
  enableIndexing?: boolean
  parallelProcessing?: boolean
  maxWorkers?: number
}

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'processing' | 'calculating' | 'indexing' | 'completed'
  progress: number
  processedRows: number
  totalRows: number
  currentBatch: number
  totalBatches: number
  memoryUsage: number
  processingRate: number // rows per second
  estimatedTimeRemaining: number // seconds
  errors: string[]
}

export interface CacheMetadata {
  fileName: string
  filePath: string
  fileSize: number
  rowCount: number
  checksum: string
  importedAt: string
  lastAccessed: string
  period: string
  status: 'cached' | 'processing' | 'completed' | 'error'
}

export class LargeCSVImportService extends EventEmitter {
  private static readonly DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024 // 4MB
  private static readonly DEFAULT_BATCH_SIZE = 10000
  private static readonly MAX_MEMORY_USAGE = 512 // MB
  private static readonly CACHE_DIR = './cache/csv-imports'
  private static readonly WATCH_DIRECTORIES = ['./data/commissions', './uploads', './']

  private db: Database.Database
  private cache: Map<string, CacheMetadata> = new Map()
  private isProcessing = false
  private currentProgress: ImportProgress

  constructor(dbPath = 'agent360.db') {
    super()
    this.db = new Database(dbPath)
    this.setupDatabase()
    this.initializeCache()
    this.currentProgress = this.createEmptyProgress()
  }

  private createEmptyProgress(): ImportProgress {
    return {
      stage: 'parsing',
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      currentBatch: 0,
      totalBatches: 0,
      memoryUsage: 0,
      processingRate: 0,
      estimatedTimeRemaining: 0,
      errors: []
    }
  }

  private setupDatabase(): void {
    // Enable performance optimizations
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('cache_size = 10000')
    this.db.pragma('temp_store = MEMORY')
    this.db.pragma('mmap_size = 268435456') // 256MB

    // Create cache metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS csv_import_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT UNIQUE NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        row_count INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        period TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata TEXT
      )
    `)

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_agent_period ON transactions(agent_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_commission_calculations_period ON commission_calculations(period);
      CREATE INDEX IF NOT EXISTS idx_commission_calculations_agent ON commission_calculations(agent_id);
    `)
  }

  private initializeCache(): void {
    // Ensure cache directory exists
    if (!fs.existsSync(LargeCSVImportService.CACHE_DIR)) {
      fs.mkdirSync(LargeCSVImportService.CACHE_DIR, { recursive: true })
    }

    // Load existing cache from database
    const cachedFiles = this.db.prepare('SELECT * FROM csv_import_cache').all() as any[]
    cachedFiles.forEach(file => {
      this.cache.set(file.file_name, file as CacheMetadata)
    })
  }

  public async importLargeCSV(
    filePath: string,
    options: LargeImportOptions = {},
    period?: string
  ): Promise<ImportResult> {
    if (this.isProcessing) {
      throw new Error('Another import is already in progress')
    }

    this.isProcessing = true
    const startTime = Date.now()
    const opts = this.mergeWithDefaults(options)

    try {
      // Check cache first
      const cacheKey = path.basename(filePath)
      const cached = this.cache.get(cacheKey)

      if (cached && cached.status === 'completed') {
        this.updateCacheAccess(cacheKey)

        return this.createCachedResult(cached)
      }

      // Validate file exists and get metadata
      const fileStats = fs.statSync(filePath)
      const checksum = await this.calculateChecksum(filePath)

      this.updateProgress({
        stage: 'parsing',
        progress: 0,
        processedRows: 0,
        totalRows: Math.floor(fileStats.size / 1000), // Rough estimate
        currentBatch: 0,
        totalBatches: Math.ceil(fileStats.size / opts.chunkSize!),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        processingRate: 0,
        estimatedTimeRemaining: 0,
        errors: []
      })

      // Start streaming import
      const result = await this.performStreamingImport(filePath, opts, period)

      // Update cache
      if (result.success) {
        this.updateCache(cacheKey, {
          fileName: cacheKey,
          filePath,
          fileSize: fileStats.size,
          rowCount: result.stats?.processedTransactions || 0,
          checksum,
          importedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          period: period || new Date().toISOString().slice(0, 7),
          status: 'completed'
        })
      }

      const processingTime = (Date.now() - startTime) / 1000
      console.log(`Large CSV import completed in ${processingTime.toFixed(2)}s`)

      return result
    } catch (error) {
      this.emit('error', error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  private async performStreamingImport(
    filePath: string,
    options: LargeImportOptions,
    period?: string
  ): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, {
        highWaterMark: options.chunkSize
      })

      let buffer = ''
      let isFirstChunk = true
      let headers: string[] = []
      let processedRows = 0
      let totalRows = 0
      let currentBatch: CSVTransactionRow[] = []
      let batchIndex = 0
      const startTime = Date.now()

      // Estimate total rows from file size
      const fileStats = fs.statSync(filePath)
      const avgRowSize = 200 // Estimated average row size in bytes
      totalRows = Math.floor(fileStats.size / avgRowSize)

      stream.on('data', async (chunk: Buffer) => {
        try {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            if (isFirstChunk && i === 0) {
              headers = this.parseCSVLine(line)
              isFirstChunk = false
              continue
            }

            const values = this.parseCSVLine(line)
            if (values.length === headers.length) {
              const row = this.createRowObject(headers, values)
              currentBatch.push(row)
              processedRows++

              // Process batch when it reaches the limit
              if (currentBatch.length >= options.batchSize!) {
                await this.processBatch(currentBatch, batchIndex++, period, options)
                currentBatch = []

                // Update progress
                const elapsed = (Date.now() - startTime) / 1000
                const rate = processedRows / elapsed
                const remainingRows = totalRows - processedRows
                const eta = remainingRows / rate

                this.updateProgress({
                  stage: 'processing',
                  progress: (processedRows / totalRows) * 100,
                  processedRows,
                  totalRows,
                  currentBatch: batchIndex,
                  totalBatches: Math.ceil(totalRows / options.batchSize!),
                  memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                  processingRate: rate,
                  estimatedTimeRemaining: eta,
                  errors: []
                })
              }
            }
          }
        } catch (error) {
          stream.destroy()
          reject(error)
        }
      })

      stream.on('end', async () => {
        try {
          // Process remaining buffer
          if (buffer.trim()) {
            const values = this.parseCSVLine(buffer.trim())
            if (values.length === headers.length) {
              const row = this.createRowObject(headers, values)
              currentBatch.push(row)
              processedRows++
            }
          }

          // Process final batch
          if (currentBatch.length > 0) {
            await this.processBatch(currentBatch, batchIndex++, period, options)
          }

          this.updateProgress({
            ...this.currentProgress,
            stage: 'completed',
            progress: 100
          })

          resolve({
            success: true,
            data: [],
            stats: {
              processedTransactions: processedRows,
              totalBatches: batchIndex,
              streamingProcessed: true,
              processingTime: (Date.now() - startTime) / 1000
            },
            fileLocation: filePath,
            importMethod: 'streaming'
          })
        } catch (error) {
          reject(error)
        }
      })

      stream.on('error', reject)
    })
  }

  private async processBatch(
    batch: CSVTransactionRow[],
    batchIndex: number,
    period?: string,
    _options: LargeImportOptions = {}
  ): Promise<void> {
    try {
      // Convert to transaction format
      const transactions = CSVImportService.convertToTransactionType(batch)

      // Store in database using transaction for performance
      const insertTransaction = this.db.prepare(`
        INSERT OR REPLACE INTO transactions (
          transaction_id, agent_name, customer_name, customer_phone,
          customer_account, type, amount, fee, net_amount, commission_amount,
          commission_eligible, status, location, zone, channel, narration,
          reference, initiated_by, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = this.db.transaction((txns: any[]) => {
        for (const txn of txns) {
          insertTransaction.run(
            txn.id,
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

      // Update agents table
      await this.updateAgentsStats(transactions)
    } catch (error) {
      console.error(`Error processing batch ${batchIndex}:`, error)
      throw error
    }
  }

  private async updateAgentsStats(transactions: TransactionType[]): Promise<void> {
    const updateAgent = this.db.prepare(`
      INSERT OR REPLACE INTO agents (account_number, name, type, branch_code, branch_name,
        total_transaction_amount, transaction_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    const agentStats = new Map<string, any>()

    transactions.forEach(txn => {
      const key = txn.agentId
      if (!agentStats.has(key)) {
        agentStats.set(key, {
          accountNumber: txn.agentId,
          name: txn.agentName,
          type: CSVImportService.classifyAgentType(txn.agentId, txn.agentName, txn.branchCode || ''),
          branchCode: txn.branchCode || '',
          branchName: txn.location || '',
          totalAmount: 0,
          transactionCount: 0
        })
      }

      const stats = agentStats.get(key)
      stats.totalAmount += txn.amount
      stats.transactionCount++
    })

    // Update all agents in a transaction
    const updateTransaction = this.db.transaction(() => {
      for (const [, stats] of agentStats) {
        updateAgent.run(
          stats.accountNumber,
          stats.name,
          stats.type,
          stats.branchCode,
          stats.branchName,
          stats.totalAmount,
          stats.transactionCount
        )
      }
    })

    updateTransaction()
  }

  private mergeWithDefaults(options: LargeImportOptions): LargeImportOptions {
    return {
      chunkSize: options.chunkSize || LargeCSVImportService.DEFAULT_CHUNK_SIZE,
      batchSize: options.batchSize || LargeCSVImportService.DEFAULT_BATCH_SIZE,
      maxMemoryUsage: options.maxMemoryUsage || LargeCSVImportService.MAX_MEMORY_USAGE,
      enableCaching: options.enableCaching !== false,
      cacheDirectory: options.cacheDirectory || LargeCSVImportService.CACHE_DIR,
      enableIndexing: options.enableIndexing !== false,
      parallelProcessing: options.parallelProcessing || false,
      maxWorkers: options.maxWorkers || 4
    }
  }

  private updateCacheAccess(cacheKey: string): void {
    const updateAccess = this.db.prepare(`
      UPDATE csv_import_cache SET last_accessed = CURRENT_TIMESTAMP WHERE file_name = ?
    `)
    updateAccess.run(cacheKey)
  }

  private createCachedResult(cached: CacheMetadata): ImportResult {
    return {
      success: true,
      data: [],
      stats: {
        processedTransactions: cached.rowCount,
        cached: true,
        cachedAt: cached.importedAt
      },
      fileLocation: cached.filePath,
      importMethod: 'streaming' as const
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto')
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)

    return new Promise((resolve, reject) => {
      stream.on('data', (data: Buffer) => hash.update(data.toString('binary')))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  private updateProgress(progress: Partial<ImportProgress>): void {
    this.currentProgress = { ...this.currentProgress, ...progress }
    this.emit('progress', this.currentProgress)
  }

  private updateCache(cacheKey: string, metadata: CacheMetadata): void {
    this.cache.set(cacheKey, metadata)

    const insertCache = this.db.prepare(`
      INSERT OR REPLACE INTO csv_import_cache (
        file_name, file_path, file_size, row_count, checksum,
        imported_at, last_accessed, period, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertCache.run(
      metadata.fileName,
      metadata.filePath,
      metadata.fileSize,
      metadata.rowCount,
      metadata.checksum,
      metadata.importedAt,
      metadata.lastAccessed,
      metadata.period,
      metadata.status,
      JSON.stringify(metadata)
    )
  }

  // Helper method to parse CSV line handling quoted values
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
      } else if (inQuotes && char === quoteChar) {
        if (nextChar === quoteChar) {
          // Escaped quote
          current += char
          i++ // Skip next quote
        } else {
          inQuotes = false
          quoteChar = ''
        }
      } else if (!inQuotes && char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current.trim())

    return result
  }

  // Helper method to create row object from headers and values
  private createRowObject(headers: string[], values: string[]): CSVTransactionRow {
    const row: CSVTransactionRow = {}

    headers.forEach((header, index) => {
      const value = values[index] || ''
      row[header as keyof CSVTransactionRow] = value
    })

    return row
  }

  // Public methods for cache management
  public getCacheMetadata(): CacheMetadata[] {
    return Array.from(this.cache.values())
  }

  public clearCache(): void {
    this.cache.clear()
    this.db.exec('DELETE FROM csv_import_cache')
  }

  public clearExpiredCache(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAge).toISOString()
    const deleteExpired = this.db.prepare('DELETE FROM csv_import_cache WHERE imported_at < ?')
    deleteExpired.run(cutoffTime)

    // Update in-memory cache
    for (const [key, metadata] of this.cache) {
      if (new Date(metadata.importedAt) < new Date(cutoffTime)) {
        this.cache.delete(key)
      }
    }
  }

  // Directory monitoring for automatic imports (disabled due to missing chokidar dependency)
  public startDirectoryMonitoring(directories: string[] = LargeCSVImportService.WATCH_DIRECTORIES): void {
    console.warn('Directory monitoring disabled - chokidar dependency not available')
    console.log('To enable directory monitoring, install chokidar: npm install chokidar')

    // Create directories if they don't exist
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  // Performance optimization methods
  public optimizeDatabase(): void {
    console.log('Optimizing database performance...')

    this.db.exec('ANALYZE')
    this.db.exec('VACUUM')
    this.db.exec('REINDEX')

    console.log('Database optimization completed')
  }

  public getImportProgress(): ImportProgress {
    return this.currentProgress
  }

  public isCurrentlyProcessing(): boolean {
    return this.isProcessing
  }

  // Cleanup method
  public dispose(): void {
    if (this.db) {
      this.db.close()
    }
    this.removeAllListeners()
  }
}
