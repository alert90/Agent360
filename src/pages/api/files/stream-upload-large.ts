import { NextApiRequest, NextApiResponse } from 'next/types'
import { UploadResult } from '../../../types/uploadTypes'
import * as fs from 'fs'
import * as path from 'path'
import * as Papa from 'papaparse'
import Database from 'better-sqlite3'
import { J } from '@fullcalendar/core/internal-common'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleLargeFileUpload(req, res)
  } else {
    res.setHeader('Allow', ['POST'])

    return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function handleLargeFileUpload(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      'file-id': fileId,
      'file-name': fileName,
      'file-size': fileSize,
      'chunk-index': chunkIndex,
      'total-chunks': totalChunks,
      'upload-id': uploadId
    } = req.headers

    if (!fileId || !fileName || !fileSize || !chunkIndex || !totalChunks || !uploadId) {
      return res.status(400).json({ message: 'Missing required headers' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'temp')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const tempFilePath = path.join(uploadsDir, `${fileId}.tmp`)
    const chunkNum = parseInt(chunkIndex as string)
    const total = parseInt(totalChunks as string)

    // Read the raw body as a buffer
    const chunks: Uint8Array[] = []

    return new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk))
      })

      req.on('end', async () => {
        try {
          // Calculate total size
          const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
          const chunkData = new Uint8Array(totalSize)
          let offset = 0

          // Copy all chunks into the buffer
          for (const chunk of chunks) {
            chunkData.set(chunk, offset)
            offset += chunk.length
          }

          // Write chunk to file
          if (chunkNum === 0) {
            // First chunk - create new file
            fs.writeFileSync(tempFilePath, new Uint8Array(chunkData))
          } else {
            // Append to existing file
            fs.appendFileSync(tempFilePath, new Uint8Array(chunkData))
          }

          console.log(`Uploaded chunk ${chunkNum + 1}/${total} for file: ${fileName}`)

          if (chunkNum === total - 1) {
            // Last chunk - process the complete file
            const finalDir = path.join(process.cwd(), 'uploads')
            if (!fs.existsSync(finalDir)) {
              fs.mkdirSync(finalDir, { recursive: true })
            }

            const finalFilePath = path.join(finalDir, fileName as string)
            fs.renameSync(tempFilePath, finalFilePath)

            console.log(`Completed upload: ${fileName} -> ${finalFilePath}`)

            const result = await processFileInBackground(finalFilePath, fileId as string)

            res.status(200).json(result)
          } else {
            // More chunks to come
            res.status(200).json({
              message: 'Chunk uploaded successfully',
              chunkIndex: chunkNum,
              progress: ((chunkNum + 1) / total) * 100
            })
          }

          resolve()
        } catch (error) {
          console.error('Error processing chunk:', error)
          res.status(500).json({
            message: 'Failed to process chunk',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          reject(error)
        }
      })

      req.on('error', error => {
        console.error('Stream error:', error)
        res.status(500).json({
          message: 'Stream error',
          error: error.message
        })
        reject(error)
      })
    })
  } catch (error) {
    console.error('Upload error:', error)

    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function processFileInBackground(filePath: string, fileId: string): Promise<any> {
  const db = new Database('agent360.db')

  try {
    console.log(`Starting background processing for: ${filePath}`)

    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      transform: value => value.trim()
    })

    if (!parseResult.data || parseResult.data.length === 0) {
      console.log('No data found in CSV file')

      return
    }

    const dataRows = parseResult.data
    console.log(`Total data rows to process: ${dataRows.length}`)

    for (let i = 0; i < Math.min(5, dataRows.length); i++) {
      console.log(`Row ${i + 1} sample:`, JSON.stringify(dataRows[i]))
    }

    const stats = {
      totalRows: dataRows.length,
      processedRows: 0,
      failedRows: 0,
      newAgents: 0,
      newTransactions: 0,
      errors: [] as string[]
    }

    // Track unique agents
    const uniqueAgents = new Set<string>()
    const checkAgentStmt = db.prepare('SELECT id FROM agents WHERE account_number = ?')
    const insertAgentStmt = db.prepare(`
      INSERT INTO agents (account_number, name, type, branch_code, branch_name, is_active,
                         total_transaction_amount, transaction_count, payband, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, 1, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    const updateAgentStmt = db.prepare(`
      UPDATE agents
      SET name = ?, branch_code = ?, branch_name = ?,
          total_transaction_amount = total_transaction_amount + ?,
          transaction_count = transaction_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE account_number = ?
    `)
    const checkTransactionStmt = db.prepare('SELECT id FROM transactions WHERE transaction_id = ?')
    const insertTransactionStmt = db.prepare(`
      INSERT INTO transactions (
        transaction_id, agent_id, agent_name, customer_name, customer_account,
        type, amount, fee, net_amount, commission_amount, commission_eligible,
        status, location, zone, channel, narration, reference, initiated_by, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 1, 'completed', ?, ?, ?, ?, ?, 'customer', ?, CURRENT_TIMESTAMP)
    `)

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i]

        // Parse transaction data from your CSV sample
        const parsedTransaction = parseTransactionFromRowPapa(row)

        if (!parsedTransaction) {
          stats.failedRows++
          stats.errors.push(`Row ${i + 2}: Invalid transaction data`)
          continue
        }

        // Check if agent is new
        const isNewAgent = !uniqueAgents.has(parsedTransaction.agentAccount)
        if (isNewAgent) {
          uniqueAgents.add(parsedTransaction.agentAccount)
        }

        let agentId: number

        // **ACTUALLY SAVE TO DATABASE**
        const existingAgent = checkAgentStmt.get(parsedTransaction.agentAccount) as any

        if (existingAgent) {
          // Update existing agent
          updateAgentStmt.run(
            parsedTransaction.agentName,
            parsedTransaction.branchCode,
            parsedTransaction.branchName,
            parsedTransaction.amount,
            parsedTransaction.agentAccount
          )
          agentId = existingAgent.id
        } else {
          // Insert new agent
          const result = insertAgentStmt.run(
            parsedTransaction.agentAccount,
            parsedTransaction.agentName,
            'local_agent',
            parsedTransaction.branchCode || null,
            parsedTransaction.branchName || null,
            parsedTransaction.amount
          )
          agentId = result.lastInsertRowid as number
          if (isNewAgent) {
            stats.newAgents++
          }

          // Auto-populate branch data for new agents if not provided
          if ((!parsedTransaction.branchCode || !parsedTransaction.branchName) && agentId) {
            const branchDataStmt = db.prepare(`
              SELECT branch_code, location as branch_name
              FROM transactions
              WHERE agent_id = ?
              ORDER BY created_at DESC
              LIMIT 1
            `).get(agentId) as any

            if (branchDataStmt && (branchDataStmt.branch_code || branchDataStmt.branch_name)) {
              const updateBranchStmt = db.prepare(`
                UPDATE agents SET
                  branch_code = COALESCE(branch_code, ?),
                  branch_name = COALESCE(branch_name, ?),
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `)
              updateBranchStmt.run(
                branchDataStmt.branch_code,
                branchDataStmt.branch_name,
                agentId
              )
              console.log(`Auto-populated branch data for new agent ${agentId}`)
            }
          }
        }

        // Check if transaction already exists
        const existingTransaction = checkTransactionStmt.get(parsedTransaction.transactionId) as any

        if (!existingTransaction) {
          // **ACTUALLY SAVE TRANSACTION TO DATABASE**
          insertTransactionStmt.run(
            parsedTransaction.transactionId,
            agentId,
            parsedTransaction.agentName,
            parsedTransaction.customerName,
            parsedTransaction.customerAccount,
            parsedTransaction.type,
            parsedTransaction.amount,
            parsedTransaction.amount,
            parsedTransaction.branchName,
            extractZone(parsedTransaction.branchName),
            parsedTransaction.channel,
            parsedTransaction.narration,
            parsedTransaction.transactionId,
            parsedTransaction.transactionDate
          )
          stats.newTransactions++
        }

        stats.processedRows++

        // Log progress every 1000 rows
        if (i % 1000 === 0) {
          console.log(`Processed ${i} rows...`)
        }

        if (i < 10) {
          console.log(`Processed row ${i + 1}: ${parsedTransaction.agentName} - ${parsedTransaction.amount}`)
        }
      } catch (error) {
        stats.failedRows++
        stats.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Return result
    const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as any
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any
    console.log(`===== DATABASE AFTER PROCESSING =====`)
    console.log(`Total Agents: ${agentCount.count}`)
    console.log(`Total Transactions in DB: ${transactionCount.count}`)

    const sampleTransactions = db.prepare('SELECT * FROM transactions LIMIT 5').all()
    console.log('Sample Transactions:', sampleTransactions)

    const result = {
      success: stats.processedRows > 0,
      message:
        stats.processedRows > 0
          ? `Successfully processed ${stats.processedRows} transactions`
          : 'Failed to process any transactions',
      stats,
      processingTime: 10
    }

    console.log(`Background processing completed for: ${filePath}`)

    // Store result for preview
    const previewData = {
      fileId,
      filePath,
      result,
      processedAt: new Date()
    }

    ;(global as any).processedFiles = (global as any).processedFiles || new Map()
    ;(global as any).processedFiles.set(fileId, previewData)

    return result
  } catch (error) {
    console.error(`Background processing failed for: ${filePath}`, error)
    throw error
  } finally {
    db.close()
  }
}

// Helper function to parse transaction from your CSV sample
function parseTransactionFromRowPapa(row: any) {
  try {
    const transactionId = (row.TRANSACTIONID1 || '').toString()
    const agentName = (row.AGENTSNAME || '').toString()
    const agentAccount = (row.AGNTACCNT || '').toString()
    const branchCode = (row.BRC || '').toString()
    const branchName = (row.BRCHNAME || '').toString()
    const transactionDate = (row.TRXDATE || '').toString()
    const narration = (row.NARRATION || '').toString()

    let uniqueRef = transactionId

    const refMatch = narration.match(/Ref[:\s]+([A-Za-z0-9]+)/i)
    if (refMatch && refMatch[1]) {
      uniqueRef = refMatch[1]
      console.log(`Found unique reference: ${uniqueRef} from narration`)
    } else {
      console.log(`No unique reference found in narration: ${narration}`)
    }

    const amountStr = row.AMOUNTDEBIT || '0'
    console.log(`Amount debit from papa: "${amountStr}"`)

    let amount = 0

    if (row.AMOUNTDEBIT && row.AMOUNTDEBIT.toString().trim() !== '') {
      const debitStr = row.AMOUNTDEBIT.toString().replace(/["',]/g, '')
      amount = parseFloat(debitStr) || 0
      console.log(`using AMOUNTDEBIT: ${debitStr} -> ${amount}`)
    }

    // Fallback to AMOUNTCREDIT if AMOUNTDEBIT is zero or empty

    if (amount === 0 && row.AMOUNTCREDIT && row.AMOUNTCREDIT.toString().trim() !== '0') {
      const creditStr = row.AMOUNTCREDIT.toString().replace(/["',]/g, '')
      amount = parseFloat(creditStr) || 0
      console.log(`using AMOUNTCREDIT: ${creditStr} -> ${amount}`)
    }

    const customerName = (row.CSTMNAME || '').toString()
    let customerAccount = (row.CSTMACCNT || '').toString()
    const channel = (row.CHANNEL || 'AGENCY').toString()

    if (customerAccount.includes('E') || customerAccount.includes('e')) {
      try {
        customerAccount = parseFloat(customerAccount).toFixed(0)
      } catch (e) {}
    }

    // Determine transaction type from narration
    let type: 'deposit' | 'withdrawal' | 'transfer' = 'transfer'
    const lowerNarration = narration.toLowerCase()
    if (lowerNarration.includes('deposit') || lowerNarration.includes('dep')) {
      type = 'deposit'
    } else if (lowerNarration.includes('withdrawal') || lowerNarration.includes('withdraw')) {
      type = 'withdrawal'
    }

    // Extract date from format like "01/10/2025 00:00"
    let formattedDate = new Date().toISOString().split('T')[0]
    const dateMatch = transactionDate.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      formattedDate = `${year}-${month}-${day}`
    }

    console.log(`Parsed: Ref=${uniqueRef}, Agent=${agentName}, Amount=${amount}, Type=${type}`)

    return {
      transactionId: uniqueRef,
      agentName,
      agentAccount,
      branchCode,
      branchName,
      transactionDate: formattedDate,
      narration,
      amount,
      customerName,
      customerAccount,
      channel,
      type
    }
  } catch (error) {
    console.error('Error parsing row:', error, 'Row:', row)

    return null
  }
}

function extractZone(branchName: string): string {
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
