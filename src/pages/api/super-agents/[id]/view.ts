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

    const { id } = req.query
    if (!id) {
      return res.status(400).json({ message: 'Super Agent ID is required' })
    }

    // Get super agent/franchise details
    const superAgentQuery = `
      SELECT
        sa.*,
        COUNT(a.id) as assigned_agents_count,
        COUNT(t.id) as total_transactions_count,
        COALESCE(SUM(t.amount), 0) as total_transaction_amount,
        COALESCE(SUM(t.commission_amount), 0) as total_commission_amount,
        COUNT(CASE WHEN t.timestamp >= date('now', '-30 days') THEN 1 END) as recent_transactions_count,
        COALESCE(SUM(CASE WHEN t.timestamp >= date('now', '-30 days') THEN t.amount END), 0) as recent_transaction_amount
      FROM agents sa
      LEFT JOIN agents a ON sa.id = a.parent_agent_id
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE sa.id = ? AND sa.type IN ('super_agent', 'franchise') AND sa.is_active = 1
      GROUP BY sa.id
    `

    const superAgent = db.prepare(superAgentQuery).get(id) as any

    if (!superAgent) {
      return res.status(404).json({ message: 'Super agent/franchise not found' })
    }

    // Apply role-based access control
    if (user.role === 'agent') {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (user.role === 'super_agent' || user.role === 'franchise') {
      if (superAgent.id !== user.id) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    // Get assigned agents with their transaction summaries
    const assignedAgentsQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.branch_name,
        a.branch_code,
        a.is_active,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(SUM(t.commission_amount), 0) as commission_amount,
        COUNT(CASE WHEN t.timestamp >= date('now', '-30 days') THEN 1 END) as recent_transactions,
        COALESCE(SUM(CASE WHEN t.timestamp >= date('now', '-30 days') THEN t.amount END), 0) as recent_amount
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE a.parent_agent_id = ?
      GROUP BY a.id
      ORDER BY a.name
    `

    const assignedAgents = db.prepare(assignedAgentsQuery).all(superAgent.id) as any[]

    // Get recent transactions from all assigned agents
    const recentTransactionsQuery = `
      SELECT
        t.*,
        a.name as agent_name,
        a.account_number as agent_account_number,
        a.branch_name as agent_branch
      FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE a.parent_agent_id = ?
      ORDER BY t.timestamp DESC
      LIMIT 20
    `

    const recentTransactions = db.prepare(recentTransactionsQuery).all(superAgent.id) as any[]

    // Get transaction summary by type for all assigned agents
    const transactionSummaryQuery = `
      SELECT
        t.type,
        COUNT(t.id) as count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(SUM(t.commission_amount), 0) as total_commission
      FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE a.parent_agent_id = ?
      GROUP BY t.type
      ORDER BY total_amount DESC
    `

    const transactionSummary = db.prepare(transactionSummaryQuery).all(superAgent.id) as any[]

    // Get monthly performance for the last 6 months
    const monthlyPerformanceQuery = `
      SELECT
        strftime('%Y-%m', t.timestamp) as month,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(SUM(t.commission_amount), 0) as total_commission,
        COUNT(DISTINCT t.agent_id) as active_agents
      FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE a.parent_agent_id = ?
        AND t.timestamp >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', t.timestamp)
      ORDER BY month DESC
    `

    const monthlyPerformance = db.prepare(monthlyPerformanceQuery).all(superAgent.id) as any[]

    // Get top performing agents
    const topAgentsQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.branch_name,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(SUM(t.commission_amount), 0) as commission_amount
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE a.parent_agent_id = ?
        AND a.is_active = 1
      GROUP BY a.id
      ORDER BY total_amount DESC
      LIMIT 10
    `

    const topAgents = db.prepare(topAgentsQuery).all(superAgent.id) as any[]

    res.status(200).json({
      success: true,
      data: {
        super_agent: {
          ...superAgent,
          is_active: Boolean(superAgent.is_active)
        },
        assigned_agents: assignedAgents,
        recent_transactions: recentTransactions,
        transaction_summary: transactionSummary,
        monthly_performance: monthlyPerformance,
        top_agents: topAgents
      }
    })
  } catch (error) {
    console.error('Super agent view API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch super agent details',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
