import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { transactions } = req.body

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Transactions array is required'
      })
    }

    console.log(`📦 Processing batch of ${transactions.length} transactions`)

    const results = []
    const errors = []
    const duplicates = []
    const stats = {
      total: transactions.length,
      created: 0,
      skipped: 0,
      newAgents: 0,
      existingAgents: 0
    }

    // Process each transaction individually - NO TRANSACTION WRAPPER
    for (const txn of transactions) {
      try {
        // Check for duplicate transaction (individual query)
        const existingTx = await prisma.transaction.findUnique({
          where: { transactionId: txn.id }
        })

        if (existingTx) {
          duplicates.push({
            id: txn.id,
            reason: 'Transaction ID already exists'
          })
          stats.skipped++
          continue
        }

        // Find or create agent (individual queries)
        let agent = await prisma.agent.findUnique({
          where: { accountNumber: txn.agentId }
        })

        if (!agent) {
          // Create new agent
          agent = await prisma.agent.create({
            data: {
              accountNumber: txn.agentId,
              name: txn.agentName,
              type: 'local_agent',
              branchCode: txn.branchCode || '',
              branchName: txn.branchName || '',
              isActive: 1,
              commissionEligible: 1,
              totalTransactionAmount: 0,
              transactionCount: 0,
              commissionAmount: 0,
              payband: 1.0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          stats.newAgents++
        } else {
          stats.existingAgents++
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            transactionId: txn.id,
            agentId: agent.id,
            agentName: agent.name,
            customerName: txn.customerName || 'Unknown Customer',
            customerAccount: txn.customerAccount || '',
            type: txn.type || 'transfer',
            amount: txn.amount || 0,
            fee: 0,
            netAmount: txn.amount || 0,
            commissionAmount: 0,
            commissionEligible: 1,
            status: 'completed',
            location: txn.branchName || '',
            zone: extractZone(txn.branchName),
            channel: txn.channel || 'AGENCY',
            narration: txn.narration || '',
            reference: txn.id,
            timestamp: txn.timestamp ? new Date(txn.timestamp) : new Date(),
            createdAt: new Date()
          }
        })

        // Update agent totals (individual update)
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            totalTransactionAmount: {
              increment: txn.amount || 0
            },
            transactionCount: {
              increment: 1
            },
            updatedAt: new Date()
          }
        })

        results.push(transaction)
        stats.created++
      } catch (error) {
        console.error(`Error processing transaction ${txn.id}:`, error)
        errors.push({
          transaction: txn.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        stats.skipped++
      }
    }

    console.log(`✅ Batch complete: ${stats.created} created, ${stats.skipped} skipped`)

    return res.status(200).json({
      success: true,
      message: `Batch imported: ${stats.created} created, ${stats.skipped} skipped`,
      count: stats.created,
      stats,
      duplicates: duplicates.slice(0, 20),
      errors: errors.slice(0, 20)
    })
  } catch (error) {
    console.error('Import error:', error)

    return res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function extractZone(branchName: string): string {
  if (!branchName) return 'Other'
  const lower = branchName.toLowerCase()
  if (lower.includes('dar') || lower.includes('dsm')) return 'Dar es Salaam'
  if (lower.includes('arusha') || lower.includes('moshi')) return 'Northern'
  if (lower.includes('mwanza')) return 'Lake Zone'
  if (lower.includes('dodoma')) return 'Central'
  if (lower.includes('mbeya')) return 'Southern Highlands'
  if (lower.includes('moro')) return 'Eastern'

  return 'Other'
}
