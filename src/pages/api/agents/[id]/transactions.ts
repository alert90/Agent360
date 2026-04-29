import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  const agentId = parseInt(id as string)

  // Pagination parameters
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 1000
  const offset = (page - 1) * limit

  try {
    // Get the agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    let transactions: any[]
    if (agent.type === 'super_agent' || agent.type === 'franchise') {
      // Get all agents under this super_agent/franchise
      const associatedAgents = await prisma.agent.findMany({
        where: {
          OR: [{ id: agentId }, { parentAgentId: agentId }]
        },
        select: { id: true, accountNumber: true }
      })

      const agentIds = associatedAgents.map(a => a.id)
      const accountNumbers = associatedAgents.map(a => a.accountNumber).filter(Boolean)

      if (agentIds.length === 0) {
        transactions = []
      } else {
        // Count total

        // Get paginated transactions
        transactions = await prisma.transaction.findMany({
          where: {
            OR: [{ agentId: { in: agentIds } }, { customerAccount: { in: accountNumbers } }]
          },
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit
        })
      }
    } else {
      // For regular agents

      transactions = await prisma.transaction.findMany({
        where: {
          OR: [{ agentId: agentId }, { customerAccount: agent.accountNumber }]
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      })
    }

    // Calculate totals

    const trueAggregate = await prisma.transaction.aggregate({
      where: {
        agentId: agentId
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    const allTransactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: { agentId: agentId },
      _count: { type: true },
      _sum: { amount: true }
    })

    const typeSummary: Record<string, { count: number; amount: number }> = {}
    allTransactions.forEach(tx => {
      const type = tx.type || 'UNKNOWN'
      typeSummary[type] = { count: tx._count.type, amount: tx._sum.amount || 0 }
    })

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: trueAggregate._count.id || 0,
        totalPages: Math.ceil((trueAggregate._count.id || 0) / limit)
      },
      summary: {
        totalTransactions: trueAggregate._count.id || 0,
        totalAmount: trueAggregate._sum.amount || 0,
        byType: Object.entries(typeSummary).map(([type, data]) => ({
          type,
          count: data.count,
          amount: data.amount
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
