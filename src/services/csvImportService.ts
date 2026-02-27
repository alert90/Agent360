import { db, agents, transactions } from 'src/lib/db'
import { eq } from 'drizzle-orm'
import Papa from 'papaparse'
import fs from 'fs/promises'

interface ParsedTransaction {
  transactionId: string
  agentName: string
  agentAccount: string
  branchCode: string
  branchName: string
  transactionDate: string
  narration: string
  amount: number
  customerName: string
  customerAccount: string
  channel: string
  type: 'deposit' | 'withdrawal' | 'transfer'
}

interface ImportResult {
  success: boolean
  message: string
  stats: {
    totalRows: number
    processedRows: number
    failedRows: number
    newAgents: number
    newTransactions: number
    errors: string[]
  }
  processingTime: number
}

class CSVImportService {
  private parseAmount(amountStr: string): number {
    // Remove quotes, commas, and convert to number
    const cleanAmount = amountStr.replace(/["',]/g, '')
    const amount = parseFloat(cleanAmount)

    return isNaN(amount) ? 0 : amount
  }

  private parseTransactionType(narration: string): 'deposit' | 'withdrawal' | 'transfer' {
    const lowerNarration = narration.toLowerCase()
    if (lowerNarration.includes('deposit') || lowerNarration.includes('dep')) {
      return 'deposit'
    } else if (lowerNarration.includes('withdrawal') || lowerNarration.includes('withdraw')) {
      return 'withdrawal'
    } else {
      return 'transfer'
    }
  }

  private extractDate(trxDate: string): string {
    // Extract date from format like "01/10/2025 00:00"
    const dateMatch = trxDate.match(/(\d{2}\/\d{2}\/\d{4})/)
    if (dateMatch) {
      const [, dateStr] = dateMatch
      const [day, month, year] = dateStr.split('/')

      return `${year}-${month}-${day}`
    }

    return new Date().toISOString().split('T')[0]
  }

  private parseCSVRow(row: any): ParsedTransaction | null {
    try {
      // Handle the CSV format from the sample
      const transaction: ParsedTransaction = {
        transactionId: row.TRANSACTIONID ? row.TRANSACTIONID.toString().trim() : '',
        agentName: row.AGENTSNAME ? row.AGENTSNAME.toString().trim() : '',
        agentAccount: row.AGNTACCNT ? row.AGNTACCNT.toString().trim() : '',
        branchCode: row.BRC ? row.BRC.toString().trim() : '',
        branchName: row.BRCHNAME ? row.BRCHNAME.toString().trim() : '',
        transactionDate: row.TRXDATE ? this.extractDate(row.TRXDATE.toString()) : '',
        narration: row.NARRATION ? row.NARRATION.toString().trim() : '',
        amount: row.AMOUNT ? this.parseAmount(row.AMOUNT.toString()) : 0,
        customerName: row.CSTMNAME ? row.CSTMNAME.toString().trim() : '',
        customerAccount: row.CSTMACCNT ? row.CSTMACCNT.toString().trim() : '',
        channel: row.CHANNEL ? row.CHANNEL.toString().trim() : 'AGENCY',
        type: row.NARRATION ? this.parseTransactionType(row.NARRATION.toString()) : 'transfer'
      }

      // Validate required fields
      if (!transaction.transactionId || !transaction.agentName || transaction.amount <= 0) {
        return null
      }

      return transaction
    } catch (error) {
      console.error('Error parsing CSV row:', error)

      return null
    }
  }

  private async createOrUpdateAgent(transaction: ParsedTransaction): Promise<number> {
    try {
      // Check if agent exists by account number
      const existingAgent = await db
        .select()
        .from(agents)
        .where(eq(agents.accountNumber, transaction.agentAccount))
        .limit(1)

      if (existingAgent.length > 0) {
        // Update existing agent
        const agent = existingAgent[0]
        await db
          .update(agents)
          .set({
            name: transaction.agentName,
            branchCode: transaction.branchCode,
            branchName: transaction.branchName,
            totalTransactionAmount: (agent.totalTransactionAmount || 0) + transaction.amount,
            transactionCount: (agent.transactionCount || 0) + 1,
            updatedAt: new Date().toISOString()
          })
          .where(eq(agents.id, agent.id))

        return agent.id
      } else {
        // Create new agent
        const [newAgent] = await db
          .insert(agents)
          .values({
            accountNumber: transaction.agentAccount,
            name: transaction.agentName,
            type: 'local_agent', // Default type, can be updated later
            branchCode: transaction.branchCode,
            branchName: transaction.branchName,
            totalTransactionAmount: transaction.amount,
            transactionCount: 1,
            payband: 1.0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .returning()

        return newAgent.id
      }
    } catch (error) {
      console.error('Error creating/updating agent:', error)
      throw error
    }
  }

  private async createTransaction(transaction: ParsedTransaction, agentId: number): Promise<boolean> {
    try {
      // Check if transaction already exists
      const existingTransaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionId, transaction.transactionId))
        .limit(1)

      if (existingTransaction.length > 0) {
        return false // Transaction already exists
      }

      // Create new transaction
      await db.insert(transactions).values({
        transactionId: transaction.transactionId,
        agentId,
        agentName: transaction.agentName,
        customerName: transaction.customerName,
        customerAccount: transaction.customerAccount,
        type: transaction.type,
        amount: transaction.amount,
        fee: 0, // Can be calculated based on business rules
        netAmount: transaction.amount,
        commissionAmount: 0, // Will be calculated by commission service
        commissionEligible: true,
        status: 'completed',
        location: transaction.branchName,
        zone: this.extractZoneFromBranch(transaction.branchName),
        channel: transaction.channel,
        narration: transaction.narration,
        initiatedBy: 'customer',
        timestamp: transaction.transactionDate,
        createdAt: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Error creating transaction:', error)

      return false
    }
  }

  private extractZoneFromBranch(branchName: string): string {
    // Simple zone extraction - can be enhanced
    const branchLower = branchName.toLowerCase()
    if (branchLower.includes('dar') || branchLower.includes('msasani') || branchLower.includes('kariakoo')) {
      return 'Dar es Salaam'
    } else if (branchLower.includes('arusha') || branchLower.includes('moshi')) {
      return 'Northern'
    } else if (branchLower.includes('mwanza') || branchLower.includes('lake')) {
      return 'Lake Zone'
    } else if (branchLower.includes('dodoma') || branchLower.includes('central')) {
      return 'Central'
    } else {
      return 'Other'
    }
  }

  async importCSV(file: File): Promise<ImportResult> {
    const startTime = Date.now()
    const result: ImportResult = {
      success: false,
      message: '',
      stats: {
        totalRows: 0,
        processedRows: 0,
        failedRows: 0,
        newAgents: 0,
        newTransactions: 0,
        errors: []
      },
      processingTime: 0
    }

    try {
      // Parse CSV file
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      if (!parseResult.data || parseResult.data.length === 0) {
        result.message = 'No data found in CSV file'
        result.processingTime = Date.now() - startTime

        return result
      }

      result.stats.totalRows = parseResult.data.length

      // Process each row
      for (let i = 0; i < parseResult.data.length; i++) {
        try {
          const row = parseResult.data[i]
          const parsedTransaction = this.parseCSVRow(row)

          if (!parsedTransaction) {
            result.stats.failedRows++
            result.stats.errors.push(`Row ${i + 1}: Invalid data format`)
            continue
          }

          // Create or update agent
          const agentId = await this.createOrUpdateAgent(parsedTransaction)
          if (i === 0 || result.stats.newAgents === 0) {
            result.stats.newAgents++
          }

          // Create transaction
          const transactionCreated = await this.createTransaction(parsedTransaction, agentId)
          if (transactionCreated) {
            result.stats.newTransactions++
          }

          result.stats.processedRows++
        } catch (error) {
          result.stats.failedRows++
          result.stats.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      result.success = result.stats.processedRows > 0
      result.message = result.success
        ? `Successfully imported ${result.stats.newTransactions} transactions and ${result.stats.newAgents} agents`
        : 'Failed to import any data'
      result.processingTime = Date.now() - startTime
    } catch (error) {
      result.success = false
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      result.processingTime = Date.now() - startTime
    }

    return result
  }

  // Preview CSV data without importing
  async previewCSV(file: File, limit = 100): Promise<any[]> {
    try {
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      const previewData = parseResult.data
        .slice(0, limit)
        .map((row, index) => {
          const parsed = this.parseCSVRow(row)

          return parsed ? { ...parsed, rowNumber: index + 1 } : null
        })
        .filter(row => row !== null)

      return previewData
    } catch (error) {
      console.error('Error previewing CSV:', error)

      return []
    }
  }

  // Get transaction statistics
  async getTransactionStats() {
    try {
      const totalTransactions = await db.select().from(transactions)
      const totalAgents = await db.select().from(agents)

      const totalAmount = totalTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      const totalCommission = totalTransactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0)

      return {
        totalTransactions: totalTransactions.length,
        totalAgents: totalAgents.length,
        totalAmount,
        totalCommission,
        avgTransactionAmount: totalTransactions.length > 0 ? totalAmount / totalTransactions.length : 0
      }
    } catch (error) {
      console.error('Error getting transaction stats:', error)

      return {
        totalTransactions: 0,
        totalAgents: 0,
        totalAmount: 0,
        totalCommission: 0,
        avgTransactionAmount: 0
      }
    }
  }
}

export const csvImportService = new CSVImportService()
export default csvImportService
