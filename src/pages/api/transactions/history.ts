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
      search = '',
      page = 1,
      limit = 50,
      type = '',
      status = '',
      months = 3 // Default to 3 months
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

    // Add date range filter - default to last N months
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - Number(months))
    whereClause += ' AND timestamp >= ?'
    params.push(monthsAgo.toISOString())

    // Add search filter
    if (search) {
      whereClause += ' AND (agent_name LIKE ? OR customer_name LIKE ? OR transaction_id LIKE ? OR narration LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Add type filter
    if (type && type !== 'all') {
      whereClause += ' AND type = ?'
      params.push(type)
    }

    // Add status filter
    if (status && status !== 'all') {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    // Get transactions in descending order (latest first)
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

    // Calculate statistics for the period
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

    // Get transaction type breakdown
    const typeBreakdownQuery = `
      SELECT
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(commission_amount), 0) as totalCommission
      FROM transactions
      ${whereClause}
      GROUP BY type
      ORDER BY totalAmount DESC
    `
    const typeBreakdown = db.prepare(typeBreakdownQuery).all(...params)

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
        totalTransactions: stats.totalTransactions || 0,
        totalAmount: stats.totalAmount || 0,
        totalCommission: stats.totalCommission || 0,
        avgTransactionAmount: stats.avgTransactionAmount || 0,
        period: `Last ${months} months`
      },
      breakdown: {
        byType: typeBreakdown
      }
    })
  } catch (error) {
    console.error('Transactions history API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
