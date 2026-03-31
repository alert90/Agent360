import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const {
      period = 'monthly',
      transactionType = 'all',
      startDate = '',
      endDate = '',
      page = '1',
      limit = '50'
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    const whereClause: any = {}

    // Role-based filtering
    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      const userAgents = await prisma.agent.findMany({
        where: { parentAgentId: user.id, isActive: 1 },
        select: { id: true }
      })
      if (userAgents.length > 0) {
        whereClause.agentId = { in: userAgents.map(a => a.id) }
      } else {
        whereClause.id = 0
      }
    }

    if (transactionType !== 'all') {
      whereClause.type = transactionType
    }

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate as string)
    } else {
      const now = new Date()
      let monthsAgo = 3
      if (period === 'daily') monthsAgo = 0.25
      else if (period === 'weekly') monthsAgo = 1
      const fromDate = new Date(now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000)
      dateFilter.gte = fromDate
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string)
    }
    if (Object.keys(dateFilter).length > 0) {
      whereClause.timestamp = dateFilter
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
        skip: offset,
        include: {
          agent: {
            select: {
              name: true,
              accountNumber: true
            }
          }
        }
      }),
      prisma.transaction.count({ where: whereClause })
    ])

    const stats = await prisma.transaction.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { amount: true, commissionAmount: true },
      _avg: { amount: true }
    })

    const typeBreakdown = await prisma.transaction.groupBy({
      by: ['type'],
      where: whereClause,
      _count: { id: true },
      _sum: { amount: true, commissionAmount: true }
    })

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        stats: {
          totalTransactions: stats._count.id || 0,
          totalAmount: Number(stats._sum?.amount || 0),
          totalCommission: Number(stats._sum?.commissionAmount || 0),
          avgTransactionAmount: Number(stats._avg?.amount || 0)
        },
        breakdown: {
          byType: typeBreakdown
        },
        filters: {
          period,
          transactionType,
          startDate,
          endDate
        }
      }
    })
  } catch (error) {
    console.error('Transaction reports API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
