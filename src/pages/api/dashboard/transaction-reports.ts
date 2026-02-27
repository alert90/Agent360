import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

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
      endDate = '',
      page = 1,
      limit = 50
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)
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

    // Add date range filter based on period
    if (startDate) {
      whereClause += ' AND timestamp >= ?'
      params.push(startDate)
    } else if (!startDate && !endDate) {
      // Default date range based on period
      const now = new Date()
      let dateFilter: Date

      switch (period) {
        case 'daily':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          break
        case 'weekly':
          dateFilter = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000) // Last 4 weeks
          break
        case 'monthly':
        default:
          dateFilter = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000) // Last 3 months
          break
      }
      whereClause += ' AND timestamp >= ?'
      params.push(dateFilter.toISOString())
    }

    if (endDate) {
      whereClause += ' AND timestamp <= ?'
      params.push(endDate)
    }

    // Get transactions with pagination
    const transactionsQuery = `
      SELECT
        id,
        transaction_id as transactionId,
        agent_id as agentId,
        agent_name as agentName,
        customer_name as customerName,
        customer_phone as customerPhone,
        customer_account as customerAccount,
        type,
        amount,
        fee,
        net_amount as netAmount,
        commission_amount as commissionAmount,
        commission_eligible as commissionEligible,
        status,
        location,
        zone,
        channel,
        narration,
        reference,
        initiated_by as initiatedBy,
        timestamp,
        created_at as createdAt
      FROM transactions
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `

    const transactions = db.prepare(transactionsQuery).all(...params, Number(limit), offset)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      ${whereClause}
    `
    const countResult = db.prepare(countQuery).get(...params)
    const total = (countResult as any)?.total || 0

    // Calculate overall statistics
    const statsQuery = `
      SELECT
        COUNT(*) as totalTransactions,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COALESCE(AVG(amount), 0) as avgTransactionAmount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedTransactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingTransactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedTransactions
      FROM transactions
      ${whereClause}
    `
    const stats = db.prepare(statsQuery).get(...params) as any

    // Get transaction type breakdown
    const typeBreakdownQuery = `
      SELECT
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM transactions
      ${whereClause}
      GROUP BY type
      ORDER BY totalAmount DESC
    `
    const typeBreakdown = db.prepare(typeBreakdownQuery).all(...params)

    // Get time series data based on period
    let timeSeriesData: any[] = []
    let timeSeriesQuery = ''

    if (period === 'daily') {
      timeSeriesQuery = `
        SELECT
          DATE(timestamp) as period,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM transactions
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp) DESC
        LIMIT 30
      `
    } else if (period === 'weekly') {
      timeSeriesQuery = `
        SELECT
          strftime('%Y-W%W', timestamp) as period,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM transactions
        ${whereClause}
        GROUP BY strftime('%Y-W%W', timestamp)
        ORDER BY strftime('%Y-W%W', timestamp) DESC
        LIMIT 12
      `
    } else {
      timeSeriesQuery = `
        SELECT
          strftime('%Y-%m', timestamp) as period,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as amount,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM transactions
        ${whereClause}
        GROUP BY strftime('%Y-%m', timestamp)
        ORDER BY strftime('%Y-%m', timestamp) DESC
        LIMIT 12
      `
    }

    timeSeriesData = db.prepare(timeSeriesQuery).all(...params)

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
          totalTransactions: stats.totalTransactions || 0,
          totalAmount: stats.totalAmount || 0,
          totalCommission: stats.totalCommission || 0,
          avgTransactionAmount: stats.avgTransactionAmount || 0,
          completedTransactions: stats.completedTransactions || 0,
          pendingTransactions: stats.pendingTransactions || 0,
          failedTransactions: stats.failedTransactions || 0
        },
        breakdown: {
          byType: typeBreakdown
        },
        timeSeries: timeSeriesData,
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
  } finally {
    db.close()
  }
}
