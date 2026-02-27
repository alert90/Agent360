import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
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
  const db = new Database('agent360.db')

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
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const {
      period = 'monthly', // daily, weekly, monthly
      transactionType = 'all', // all, deposit, withdrawal, transfer, payment
      startDate = '',
      endDate = ''
    } = req.query

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause += ' AND agent_id = ?'
      params.push(user.id)
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      // Get agents under this user
      const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id)
        whereClause += ` AND agent_id IN (${agentIds.join(',')})`
      } else {
        whereClause += ' AND 1=0' // No agents under this user
      }
    }

    // Add transaction type filter
    if (transactionType && transactionType !== 'all') {
      whereClause += ' AND type = ?'
      params.push(transactionType)
    }

    // Add date range filter - default to last 3 months if no date range provided
    if (startDate) {
      whereClause += ' AND timestamp >= ?'
      params.push(startDate)
    } else if (!startDate && !endDate) {
      // Default to last 3 months if no date filters provided
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      whereClause += ' AND timestamp >= ?'
      params.push(threeMonthsAgo.toISOString())
    }

    if (endDate) {
      whereClause += ' AND timestamp <= ?'
      params.push(endDate)
    }

    // Calculate overall statistics
    const statsQuery = `
      SELECT
        COUNT(*) as totalTransactions,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COALESCE(AVG(amount), 0) as avgTransactionAmount
      FROM transactions
      ${whereClause}
    `
    const stats = db.prepare(statsQuery).get(...params) as any

    // Get user counts for the first card
    let userCountsQuery = `
      SELECT
        COUNT(CASE WHEN type = 'super_agent' THEN 1 END) as superAgentCount,
        COUNT(CASE WHEN type = 'local_agent' THEN 1 END) as agentCount,
        COUNT(CASE WHEN type = 'franchise' THEN 1 END) as franchiseCount
      FROM agents
      WHERE is_active = 1
    `

    // Apply role-based filtering for user counts
    if (user.role === 'super_agent' || user.role === 'franchise') {
      userCountsQuery = `
        SELECT
          COUNT(CASE WHEN a.type = 'super_agent' AND a.parent_agent_id = ? THEN 1 END) as superAgentCount,
          COUNT(CASE WHEN a.type = 'local_agent' AND a.parent_agent_id = ? THEN 1 END) as agentCount,
          COUNT(CASE WHEN a.type = 'franchise' AND a.parent_agent_id = ? THEN 1 END) as franchiseCount
        FROM agents a
        WHERE a.is_active = 1 AND a.parent_agent_id = ?
      `
    } else if (user.role === 'agent') {
      userCountsQuery = `
        SELECT 0 as superAgentCount, 0 as agentCount, 0 as franchiseCount
      `
    }

    const userCountsParams =
      user.role === 'super_agent' || user.role === 'franchise' ? [user.id, user.id, user.id, user.id] : []
    const userCounts = db.prepare(userCountsQuery).get(...userCountsParams) as any

    let timeSeriesData: any[] = []

    // Generate time series data based on period
    if (period === 'daily') {
      // Get daily data for the last 30 days
      const dailyQuery = `
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission
        FROM transactions
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp) DESC
        LIMIT 30
      `
      timeSeriesData = db.prepare(dailyQuery).all(...params)
    } else if (period === 'weekly') {
      // Get weekly data for the last 12 weeks
      const weeklyQuery = `
        SELECT
          strftime('%Y-W%W', timestamp) as week,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission
        FROM transactions
        ${whereClause}
        GROUP BY strftime('%Y-W%W', timestamp)
        ORDER BY strftime('%Y-W%W', timestamp) DESC
        LIMIT 12
      `
      timeSeriesData = db.prepare(weeklyQuery).all(...params)
    } else {
      // Get monthly data for the last 12 months
      const monthlyQuery = `
        SELECT
          strftime('%Y-%m', timestamp) as month,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission
        FROM transactions
        ${whereClause}
        GROUP BY strftime('%Y-%m', timestamp)
        ORDER BY strftime('%Y-%m', timestamp) DESC
        LIMIT 12
      `
      timeSeriesData = db.prepare(monthlyQuery).all(...params)
    }

    const analyticsData: AnalyticsData = {
      period: period as string,
      transactionType: transactionType as string,
      data: {
        totalTransactions: stats.totalTransactions || 0,
        totalAmount: stats.totalAmount || 0,
        totalCommission: stats.totalCommission || 0,
        avgTransactionAmount: stats.avgTransactionAmount || 0
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
        userCounts: {
          superAgentCount: userCounts.superAgentCount || 0,
          agentCount: userCounts.agentCount || 0,
          franchiseCount: userCounts.franchiseCount || 0
        }
      }
    })
  } catch (error) {
    console.error('Dashboard analytics API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
