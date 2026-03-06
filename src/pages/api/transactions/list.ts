import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

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

    const {
      search = '',
      page = 1,
      limit = 100,
      type = '',
      status = '',
      startDate = '',
      endDate = '',
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    // Build where clause
    const whereClause: any = {}

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      // Get agents under this user
      const userAgents = await prisma.agent.findMany({
        where: { parentAgentId: user.id },
        select: { id: true }
      })
      if (userAgents.length > 0) {
        whereClause.agentId = { in: userAgents.map(a => a.id) }
      } else {
        whereClause.id = 0 // No agents under this user
      }
    }

    // Add search filter - include customerAccount for searching by account number
    if (search) {
      whereClause.OR = [
        { agentName: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerAccount: { contains: search as string, mode: 'insensitive' } },
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

    // Add date range filter
    if (startDate || endDate) {
      whereClause.timestamp = {}
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate as string)
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate as string)
      }
    }

    // Validate sort column
    const validSortColumns = [
      'timestamp',
      'amount',
      'commissionAmount',
      'agentName',
      'customerName',
      'type',
      'status',
      'transactionId'
    ]
    const finalSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'timestamp'
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // Map sort column to Prisma format
    const sortColumnMap: Record<string, string> = {
      timestamp: 'timestamp',
      amount: 'amount',
      commission_amount: 'commissionAmount',
      agent_name: 'agentName',
      customer_name: 'customerName',
      type: 'type',
      status: 'status',
      transaction_id: 'transactionId'
    }
    const prismaSortBy = sortColumnMap[finalSortBy as string] || 'timestamp'

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { [prismaSortBy]: finalSortOrder },
        skip: offset,
        take: Number(limit)
      }),
      prisma.transaction.count({ where: whereClause })
    ])

    // Calculate statistics
    const stats = await prisma.transaction.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: {
        amount: true,
        commissionAmount: true
      },
      _avg: {
        amount: true
      }
    })

    res.status(200).json({
      success: true,
      data: transactions,
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
        avgTransactionAmount: stats._avg.amount || 0
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
