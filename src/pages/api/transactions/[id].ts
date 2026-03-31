import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Transaction ID is required' })
  }

  try {
    if (req.method === 'GET') {
      const transaction = await prisma.transaction.findUnique({
        where: { transactionId: id },
        include: {
          agent: {
            include: {
              parentAgent: true
            }
          }
        }
      })

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      const formatAccountNumber = (account: string | null) => {
        if (!account) return 'N/A'
        if (account.includes('E+')) {
          try {
            const num = parseFloat(account)
            if (!isNaN(num)) {
              return num.toFixed(0)
            }
          } catch (e) {
            // ignore
          }
        }

        return account
      }

      const relatedTransactions = await prisma.transaction.findMany({
        where: {
          agentId: transaction.agentId,
          timestamp: {
            gte: new Date(new Date(transaction.timestamp).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(transaction.timestamp).setHours(23, 59, 59, 999))
          },
          id: { not: transaction.id }
        },
        take: 10,
        orderBy: { timestamp: 'desc' }
      })

      let commissionBreakdown = {
        type: 'local_agent',
        description: 'Direct commission on transaction',
        rate: '5%',
        amount: transaction.commissionAmount || 0
      }

      if (transaction.agent?.type === 'super_agent') {
        commissionBreakdown = {
          type: 'super_agent',
          description: 'Commission from served agents',
          rate: '20% of agent commissions',
          amount: transaction.commissionAmount || 0
        }
      } else if (transaction.agent?.type === 'franchise') {
        commissionBreakdown = {
          type: 'franchise',
          description: 'Commission based on agent performance',
          rate: 'Based on turnover multiplier',
          amount: transaction.commissionAmount || 0
        }
      }

      const invoiceData = {
        transaction: {
          id: transaction.transactionId,
          internalId: transaction.id,
          date: transaction.timestamp
            ? new Date(transaction.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'N/A',
          status: transaction.status || 'pending',
          type: transaction.type || 'unknown',
          channel: transaction.channel || 'N/A',
          location: transaction.location || 'N/A',
          zone: transaction.zone || 'N/A'
        },
        customer: {
          name: transaction.customerName || 'Unknown Customer',
          account: formatAccountNumber(transaction.customerAccount),
          phone: transaction.customerPhone || 'N/A'
        },
        agent: {
          id: transaction.agentId,
          name: transaction.agentName,
          account: transaction.agent?.accountNumber || 'N/A',
          type: transaction.agent?.type || 'local_agent',
          branch: transaction.agent?.branchName || transaction.location || 'N/A',
          parentAgent: transaction.agent?.parentAgent
            ? {
                name: transaction.agent.parentAgent.name,
                account: transaction.agent.parentAgent.accountNumber
              }
            : null
        },
        financial: {
          amount: transaction.amount || 0,
          fee: transaction.fee || 0,
          netAmount: transaction.netAmount || transaction.amount || 0,
          commissionAmount: transaction.commissionAmount || 0,
          commissionEligible: transaction.commissionEligible === 1
        },
        details: {
          narration: transaction.narration || 'N/A',
          reference: transaction.reference || 'N/A',
          initiatedBy: transaction.initiatedBy || 'customer'
        },
        commissionBreakdown,
        relatedTransactions: relatedTransactions.map(rt => ({
          id: rt.id,
          agent: rt.agentName,
          account: rt.customerAccount || 'N/A',
          amount: rt.amount || 0,
          commission: rt.commissionAmount || 0
        })),
        metadata: {
          createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: transaction.updatedAt?.toISOString() || new Date().toISOString()
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
