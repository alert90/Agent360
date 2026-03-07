import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')
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

    const { search = '', page = 1, limit = 50, type = '', status = '', months = 3 } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    // Build where clause
    const whereClause: any = {}

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent' || user.role === 'franchise' || user.role === 'local_agent') {
      const userAgents = await prisma.agent.findMany({
        where: { parentAgentId: user.id },
        select: { id: true }
      })
      if (userAgents.length > 0) {
        whereClause.agentId = { in: userAgents.map(a => a.id) }
      } else {
        whereClause.id = -1 // No results
      }
    }

    // Add date range filter
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - Number(months))
    whereClause.timestamp = { gte: monthsAgo }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { agentName: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { narration: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // Add type filter
    if (type && type !== 'all') {
      whereClause.type = type
    }

    // Add status filter
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.transaction.count({ where: whereClause })
    ])

    // Calculate statistics
    const stats = await prisma.transaction.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { amount: true, commissionAmount: true },
      _avg: { amount: true }
    })

    // Get transaction type breakdown
    const typeBreakdown = await prisma.transaction.groupBy({
      by: ['type'],
      where: whereClause,
      _count: { type: true },
      _sum: { amount: true, commissionAmount: true },
      orderBy: { _sum: { amount: 'desc' } }
    })

    // Format transactions for response
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      transactionId: t.transactionId,
      agentId: t.agentId,
      agentName: t.agentName,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      customerAccount: t.customerAccount,
      type: t.type,
      amount: t.amount,
      fee: t.fee,
      netAmount: t.netAmount,
      commissionAmount: t.commissionAmount,
      commissionEligible: t.commissionEligible,
      status: t.status,
      location: t.location,
      zone: t.zone,
      channel: t.channel,
      narration: t.narration,
      reference: t.reference,
      initiatedBy: t.initiatedBy,
      timestamp: t.timestamp,
      createdAt: t.createdAt
    }))

    res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      stats: {
        totalTransactions: stats._count.id || 0,
        totalAmount: stats._sum.amount || 0,
        totalCommission: stats._sum.commissionAmount || 0,
        avgTransactionAmount: stats._avg.amount || 0,
        period: `Last ${months} months`
      },
      breakdown: {
        byType: typeBreakdown.map(t => ({
          type: t.type,
          count: t._count.type,
          totalAmount: t._sum.amount || 0,
          totalCommission: t._sum.commissionAmount || 0
        }))
      }
    })
  } catch (error) {
    console.error('Transactions history API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
