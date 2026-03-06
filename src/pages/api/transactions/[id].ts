import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Transaction ID is required' })
  }

  try {
    if (req.method === 'GET') {
      // Get detailed transaction information using raw query
      // Note: id can be either numeric ID or transaction_id string
      const numericId = parseInt(id)
      const transaction = (await prisma.$queryRawUnsafe(
        `
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
        WHERE t.id = $1 OR t.transaction_id = $2
      `,
        numericId,
        id
      )) as any[]

      if (!transaction || transaction.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      const tx = transaction[0]

      // Get related transactions (same transaction_id for grouped transactions)
      const relatedTransactions = (await prisma.$queryRawUnsafe(
        `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account
        FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        WHERE t.transaction_id = $1 AND t.id != $2
        ORDER BY t.timestamp ASC
      `,
        tx.transaction_id,
        tx.id
      )) as any[]

      // Calculate commission details
      let commissionBreakdown = {}

      if (tx.agent_type === 'local_agent') {
        commissionBreakdown = {
          type: 'local_agent',
          description: 'Direct commission on transaction',
          rate: '5%',
          amount: tx.commission_amount || 0
        }
      } else if (tx.agent_type === 'super_agent') {
        commissionBreakdown = {
          type: 'super_agent',
          description: 'Commission from served agents',
          rate: '20% of agent commissions',
          amount: tx.commission_amount || 0
        }
      } else if (tx.agent_type === 'franchise') {
        commissionBreakdown = {
          type: 'franchise',
          description: 'Commission based on agent performance',
          rate: 'Based on turnover multiplier',
          amount: tx.commission_amount || 0
        }
      }

      // Format transaction data for invoice-like display
      const invoiceData = {
        transaction: {
          id: tx.transaction_id,
          internalId: tx.id,
          date: new Date(tx.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: tx.status,
          type: tx.type,
          channel: tx.channel,
          location: tx.location,
          zone: tx.zone
        },
        customer: {
          name: tx.customer_name || 'N/A',
          account: tx.customer_account || 'N/A',
          phone: tx.customer_phone || 'N/A'
        },
        agent: {
          id: tx.agent_id,
          name: tx.agent_name,
          account: tx.agent_account,
          type: tx.agent_type,
          branch: tx.agent_branch,
          parentAgent: tx.parent_agent_name
            ? {
                name: tx.parent_agent_name,
                account: tx.parent_agent_account
              }
            : null
        },
        financial: {
          amount: tx.amount,
          fee: tx.fee || 0,
          netAmount: tx.net_amount || tx.amount,
          commissionAmount: tx.commission_amount || 0,
          commissionEligible: tx.commission_eligible
        },
        details: {
          narration: tx.narration || 'N/A',
          reference: tx.reference || 'N/A',
          initiatedBy: tx.initiated_by || 'customer'
        },
        commissionBreakdown,
        relatedTransactions: relatedTransactions.map((rt: any) => ({
          id: rt.id,
          agent: rt.agent_name,
          account: rt.agent_account,
          amount: rt.amount,
          commission: rt.commission_amount || 0
        })),
        metadata: {
          createdAt: tx.created_at,
          updatedAt: tx.updated_at
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
  }
}
