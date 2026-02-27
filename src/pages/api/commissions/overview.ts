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
      period = 'last_month', // last_month, last_two_months, last_three_months
      agentType = 'all' // all, super_agent, franchise, local_agent
    } = req.query

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case 'last_two_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case 'last_three_months':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
    }

    whereClause += ' AND cc.created_at >= ?'
    params.push(startDate.toISOString())

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause += ' AND cc.agent_id = ?'
      params.push(user.id)
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      // Get agents under this user
      const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id)
        whereClause += ` AND cc.agent_id IN (${agentIds.join(',')})`
      } else {
        whereClause += ' AND 1=0' // No agents under this user
      }
    }

    // Filter by agent type
    if (agentType && agentType !== 'all') {
      whereClause += ' AND a.type = ?'
      params.push(agentType)
    }

    // Get paid commissions with agent details
    const commissionsQuery = `
      SELECT
        cc.id,
        cc.agent_id,
        a.name as agentName,
        a.account_number as agentAccountNumber,
        a.type as agentType,
        cc.period,
        cc.total_amount,
        cc.transaction_count,
        cc.eligible_amount,
        cc.commission_rate,
        cc.commission_amount,
        cc.payband,
        cc.final_commission,
        cc.created_at,
        cc.updated_at
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
      ${whereClause}
      ORDER BY cc.final_commission DESC
    `

    const commissions = db.prepare(commissionsQuery).all(...params) as any[]

    // Calculate summary statistics
    const summaryQuery = `
      SELECT
        COUNT(*) as totalPaidCommissions,
        SUM(cc.final_commission) as totalCommissionPaid,
        AVG(cc.final_commission) as avgCommissionPaid,
        MAX(cc.final_commission) as maxCommissionPaid,
        COUNT(CASE WHEN a.type = 'super_agent' THEN 1 END) as superAgentCount,
        SUM(CASE WHEN a.type = 'super_agent' THEN cc.final_commission ELSE 0 END) as superAgentTotal,
        COUNT(CASE WHEN a.type = 'franchise' THEN 1 END) as franchiseCount,
        SUM(CASE WHEN a.type = 'franchise' THEN cc.final_commission ELSE 0 END) as franchiseTotal,
        COUNT(CASE WHEN a.type = 'local_agent' THEN 1 END) as agentCount,
        SUM(CASE WHEN a.type = 'local_agent' THEN cc.final_commission ELSE 0 END) as agentTotal
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
      ${whereClause}
    `

    const summary = db.prepare(summaryQuery).get(...params) as any

    // Get monthly breakdown
    const monthlyBreakdownQuery = `
      SELECT
        strftime('%Y-%m', cc.created_at) as month,
        COUNT(*) as count,
        SUM(cc.final_commission) as total
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
      ${whereClause}
      GROUP BY strftime('%Y-%m', cc.created_at)
      ORDER BY month DESC
      LIMIT 6
    `

    const monthlyBreakdown = db.prepare(monthlyBreakdownQuery).all(...params) as any[]

    // Get breakdown by agent type
    const typeBreakdownQuery = `
      SELECT
        a.type,
        COUNT(*) as count,
        SUM(cc.final_commission) as totalCommission,
        AVG(cc.final_commission) as avgCommission
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
      ${whereClause}
      GROUP BY a.type
      ORDER BY totalCommission DESC
    `

    const typeBreakdown = db.prepare(typeBreakdownQuery).all(...params) as any[]

    // Get top performers
    const topPerformersQuery = `
      SELECT
        a.name as agentName,
        a.account_number as agentAccountNumber,
        a.type as agentType,
        cc.transaction_count,
        cc.total_amount,
        cc.final_commission
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
      ${whereClause}
      ORDER BY cc.final_commission DESC
      LIMIT 10
    `

    const topPerformers = db.prepare(topPerformersQuery).all(...params) as any[]

    res.status(200).json({
      success: true,
      data: {
        commissions,
        summary: {
          totalPaidCommissions: summary?.totalPaidCommissions || 0,
          totalCommissionPaid: summary?.totalCommissionPaid || 0,
          avgCommissionPaid: summary?.avgCommissionPaid || 0,
          maxCommissionPaid: summary?.maxCommissionPaid || 0,
          breakdown: {
            superAgents: {
              count: summary?.superAgentCount || 0,
              total: summary?.superAgentTotal || 0
            },
            franchises: {
              count: summary?.franchiseCount || 0,
              total: summary?.franchiseTotal || 0
            },
            agents: {
              count: summary?.agentCount || 0,
              total: summary?.agentTotal || 0
            }
          }
        },
        monthlyBreakdown,
        typeBreakdown,
        topPerformers,
        filters: {
          period,
          agentType
        },
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Commission overview API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
