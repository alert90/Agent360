import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Transaction ID is required' })
  }

  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      // Get detailed transaction information
      const transactionQuery = `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account,
          a.branch_name as agent_branch,
          a.type as agent_type,
          parent_agent.name as parent_agent_name,
          parent_agent.account_number as parent_agent_account
        FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        LEFT JOIN agents parent_agent ON a.parent_agent_id = parent_agent.id
        WHERE t.id = ? OR t.transaction_id = ?
      `

      const transaction = db.prepare(transactionQuery).get(id, id) as any

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      // Get related transactions (same transaction_id for grouped transactions)
      const relatedTransactions = db
        .prepare(
          `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account
        FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        WHERE t.transaction_id = ? AND t.id != ?
        ORDER BY t.timestamp ASC
      `
        )
        .all(transaction.transaction_id, transaction.id) as any[]

      // Calculate commission details
      let commissionBreakdown = {}

      if (transaction.agent_type === 'local_agent') {
        commissionBreakdown = {
          type: 'local_agent',
          description: 'Direct commission on transaction',
          rate: '5%', // This should come from config
          amount: transaction.commission_amount || 0
        }
      } else if (transaction.agent_type === 'super_agent') {
        commissionBreakdown = {
          type: 'super_agent',
          description: 'Commission from served agents',
          rate: '20% of agent commissions', // This should come from config
          amount: transaction.commission_amount || 0
        }
      } else if (transaction.agent_type === 'franchise') {
        commissionBreakdown = {
          type: 'franchise',
          description: 'Commission based on agent performance',
          rate: 'Based on turnover multiplier', // This should come from config
          amount: transaction.commission_amount || 0
        }
      }

      // Format transaction data for invoice-like display
      const invoiceData = {
        transaction: {
          id: transaction.transaction_id,
          internalId: transaction.id,
          date: new Date(transaction.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: transaction.status,
          type: transaction.type,
          channel: transaction.channel,
          location: transaction.location,
          zone: transaction.zone
        },
        customer: {
          name: transaction.customer_name || 'N/A',
          account: transaction.customer_account || 'N/A',
          phone: transaction.customer_phone || 'N/A'
        },
        agent: {
          id: transaction.agent_id,
          name: transaction.agent_name,
          account: transaction.agent_account,
          type: transaction.agent_type,
          branch: transaction.agent_branch,
          parentAgent: transaction.parent_agent_name
            ? {
                name: transaction.parent_agent_name,
                account: transaction.parent_agent_account
              }
            : null
        },
        financial: {
          amount: transaction.amount,
          fee: transaction.fee || 0,
          netAmount: transaction.net_amount || transaction.amount,
          commissionAmount: transaction.commission_amount || 0,
          commissionEligible: transaction.commission_eligible
        },
        details: {
          narration: transaction.narration || 'N/A',
          reference: transaction.reference || 'N/A',
          initiatedBy: transaction.initiated_by || 'customer'
        },
        commissionBreakdown,
        relatedTransactions: relatedTransactions.map(rt => ({
          id: rt.id,
          agent: rt.agent_name,
          account: rt.agent_account,
          amount: rt.amount,
          commission: rt.commission_amount || 0
        })),
        metadata: {
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at
        }
      }

      res.status(200).json({
        success: true,
        data: invoiceData
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Transaction detail API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
