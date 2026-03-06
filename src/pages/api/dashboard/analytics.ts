import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

interface AnalyticsData {
  period: string
  transactionType: string
  data: {
    totalTransactions: number
    totalAmount: number
    totalCommission: number
    avgTransactionAmount: number
    dailyData?: Array<{
      date: string
      transactions: number
      amount: number
      commission: number
    }>
    weeklyData?: Array<{
      week: string
      transactions: number
      amount: number
      commission: number
    }>
    monthlyData?: Array<{
      month: string
      transactions: number
      amount: number
      commission: number
    }>
  }
}

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

    const { period = 'monthly', transactionType = 'all', startDate = '', endDate = '' } = req.query

    // Build where clause
    const whereClause: any = {}

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      const userAgents = await prisma.agent.findMany({
        where: { parentAgentId: user.id },
        select: { id: true }
      })
      if (userAgents.length > 0) {
        whereClause.agentId = { in: userAgents.map(a => a.id) }
      } else {
        whereClause.id = 0
      }
    }

    // Add transaction type filter
    if (transactionType && transactionType !== 'all') {
      whereClause.type = transactionType
    }

    // Add date range filter - default to last 3 months
    let dateFilter = {}
    if (startDate) {
      dateFilter = { gte: new Date(startDate as string) }
    } else if (!startDate && !endDate) {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      dateFilter = { gte: threeMonthsAgo }
    }
    if (endDate) {
      dateFilter = { ...dateFilter, lte: new Date(endDate as string) }
    }
    if (Object.keys(dateFilter).length > 0) {
      whereClause.timestamp = dateFilter
    }

    // Calculate overall statistics
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

    // Get user counts for the first card
    let userCounts
    if (user.role === 'super_agent' || user.role === 'franchise') {
      const [superAgentCount, agentCount, franchiseCount] = await Promise.all([
        prisma.agent.count({ where: { type: 'super_agent', parentAgentId: user.id, isActive: 1 } }),
        prisma.agent.count({ where: { type: 'local_agent', parentAgentId: user.id, isActive: 1 } }),
        prisma.agent.count({ where: { type: 'franchise', parentAgentId: user.id, isActive: 1 } })
      ])
      userCounts = { superAgentCount, agentCount, franchiseCount }
    } else if (user.role === 'agent') {
      userCounts = { superAgentCount: 0, agentCount: 0, franchiseCount: 0 }
    } else {
      const [superAgentCount, agentCount, franchiseCount] = await Promise.all([
        prisma.agent.count({ where: { type: 'super_agent', isActive: 1 } }),
        prisma.agent.count({ where: { type: 'local_agent', isActive: 1 } }),
        prisma.agent.count({ where: { type: 'franchise', isActive: 1 } })
      ])
      userCounts = { superAgentCount, agentCount, franchiseCount }
    }

    // Generate time series data based on period
    let timeSeriesData: any[] = []

    if (period === 'daily') {
      // Get daily data for the last 30 days
      timeSeriesData = await prisma.$queryRawUnsafe(`
        SELECT
          DATE(timestamp) as date,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(amount), 0)::numeric as amount,
          COALESCE(SUM(commission_amount), 0)::numeric as commission
        FROM transactions
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp) DESC
        LIMIT 30
      `)
    } else if (period === 'weekly') {
      // Get weekly data for the last 12 weeks
      timeSeriesData = await prisma.$queryRawUnsafe(`
        SELECT
          TO_CHAR(DATE_TRUNC('week', timestamp), 'YYYY-IW') as week,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(amount), 0)::numeric as amount,
          COALESCE(SUM(commission_amount), 0)::numeric as commission
        FROM transactions
        WHERE timestamp >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', timestamp)
        ORDER BY DATE_TRUNC('week', timestamp) DESC
        LIMIT 12
      `)
    } else {
      // Get monthly data for the last 12 months
      timeSeriesData = await prisma.$queryRawUnsafe(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') as month,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(amount), 0)::numeric as amount,
          COALESCE(SUM(commission_amount), 0)::numeric as commission
        FROM transactions
        WHERE timestamp >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY DATE_TRUNC('month', timestamp) DESC
        LIMIT 12
      `)
    }

    const analyticsData: AnalyticsData = {
      period: period as string,
      transactionType: transactionType as string,
      data: {
        totalTransactions: stats._count.id || 0,
        totalAmount: Number(stats._sum.amount) || 0,
        totalCommission: Number(stats._sum.commissionAmount) || 0,
        avgTransactionAmount: Number(stats._avg.amount) || 0
      }
    }

    // Add time series data based on period
    if (period === 'daily') {
      analyticsData.data.dailyData = timeSeriesData
    } else if (period === 'weekly') {
      analyticsData.data.weeklyData = timeSeriesData
    } else {
      analyticsData.data.monthlyData = timeSeriesData
    }

    res.status(200).json({
      success: true,
      data: {
        ...analyticsData,
        userCounts
      }
    })
  } catch (error) {
    console.error('Dashboard analytics API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
