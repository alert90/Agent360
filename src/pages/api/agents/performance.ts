import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { search = '', page = 1, limit = 25, type = '', sortBy = 'total_amount', sortOrder = 'desc' } = req.query

      const offset = (Number(page) - 1) * Number(limit)

      // Build where clause for agents
      const where: any = { isActive: 1 }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { accountNumber: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (type && type !== '') {
        where.type = type
      }

      // Get transaction stats grouped by agentId
      const transactionStats = await prisma.transaction.groupBy({
        by: ['agentId'],
        _sum: {
          amount: true,
          commissionAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        }
      })

      // Get agents with matching agentIds or fallback to transaction agentName matching
      const agentIds = [...new Set(transactionStats.map(stat => stat.agentId).filter(Boolean))]
      const agents = await prisma.agent.findMany({
        where: {
          OR: [{ id: { in: agentIds } }, { isActive: 1 }],
          ...where
        },
        orderBy: { totalTransactionAmount: 'desc' },
        skip: offset,
        take: Number(limit)
      })

      // Total count
      const total = await prisma.agent.count({ where })

      // Calculate performance matching agents list logic
      const agentPerformance = agents.map(agent => {
        // Find matching transaction stat
        const stat = transactionStats.find(s => s.agentId === agent.id)

        const transactions = stat ? stat._count.id : agent.transactionCount || 0
        const totalAmount = stat ? stat._sum.amount || 0 : agent.totalTransactionAmount || 0
        const commissionAmount = stat ? stat._sum.commissionAmount || 0 : agent.commissionAmount || 0

        return {
          id: agent.id,
          name: agent.name,
          accountNumber: agent.accountNumber || 'N/A',
          type: agent.type || 'local_agent',
          transactions,
          totalAmount,
          commissionAmount,
          actions: true
        }
      })

      // Sort if specified
      agentPerformance.sort((a, b) => {
        switch (sortBy) {
          case 'totalAmount':
            return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount
          case 'transactions':
            return sortOrder === 'desc' ? b.transactions - a.transactions : a.transactions - b.transactions
          case 'commissionAmount':
            return sortOrder === 'desc'
              ? b.commissionAmount - a.commissionAmount
              : a.commissionAmount - b.commissionAmount
          default:
            return 0
        }
      })

      res.status(200).json({
        success: true,
        data: agentPerformance,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agent performance API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
