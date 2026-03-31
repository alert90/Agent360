import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

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

    const {
      search = '',
      page = '1',
      limit = '100',
      type = '',
      startDate = '',
      endDate = '',
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

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
        whereClause.id = -1 // No results
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { agentName: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerAccount: { contains: search as string, mode: 'insensitive' } },
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { narration: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // Type filter
    if (type && type !== 'all') {
      whereClause.type = type
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.timestamp = {}
      if (startDate) whereClause.timestamp.gte = new Date(startDate as string)
      if (endDate) whereClause.timestamp.lte = new Date(endDate as string)
    }

    // Sort validation
    const validSortColumns = [
      'timestamp',
      'amount',
      'commissionAmount',
      'agentName',
      'customerName',
      'type',
      'transactionId'
    ]
    const finalSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'timestamp'
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { [finalSortBy as string]: finalSortOrder },
        skip: offset,
        take: limitNum
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

    // Format transactions for frontend
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      transactionId: t.transactionId,
      agentId: t.agentId,
      agentName: t.agentName,
      customerName: t.customerName,
      customerAccount: t.customerAccount,
      type: t.type,
      amount: t.amount,
      commissionAmount: t.commissionAmount,
      timestamp: t.timestamp,
      location: t.location,
      narration: t.narration
    }))

    res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        totalTransactions: stats._count.id || 0,
        totalAmount: Number(stats._sum.amount) || 0,
        totalCommission: Number(stats._sum.commissionAmount) || 0,
        avgTransactionAmount: Number(stats._avg.amount) || 0
      }
    })
  } catch (error) {
    console.error('Transactions list API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
