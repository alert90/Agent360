import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
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
        return res.status(400).json({ message: 'Agent ID is required' })
      }

      // Get agent details with comprehensive information
      const agentQuery = `
      SELECT
        a.*,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_transaction_amount,
        COALESCE(SUM(t.commission_amount), 0) as commission_amount,
        COUNT(CASE WHEN t.timestamp >= date('now', '-30 days') THEN 1 END) as recent_transactions,
        COALESCE(SUM(CASE WHEN t.timestamp >= date('now', '-30 days') THEN t.amount END), 0) as recent_amount,
        CASE
          WHEN a.transaction_count >= 10 AND a.total_transaction_amount >= 1000000 THEN 1
          ELSE 0
        END as commission_eligible
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE a.id = ?
      GROUP BY a.id
    `

      const agent = db.prepare(agentQuery).get(id) as any

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' })
      }

      // Apply role-based access control
      if (user.role === 'agent' && agent.id !== user.id) {
        return res.status(403).json({ message: 'Access denied' })
      }

      if (user.role === 'super_agent' || user.role === 'franchise') {
        // Get agents under this user
        const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
        if (userAgents.length > 0) {
          const agentIds = userAgents.map(a => a.id)
          if (!agentIds.includes(agent.id)) {
            return res.status(403).json({ message: 'Access denied' })
          }
        }
      }

      // Get parent agent info if exists
      let parentAgent = null
      if (agent.parent_agent_id) {
        parentAgent = db
          .prepare('SELECT id, name, account_number, type FROM agents WHERE id = ?')
          .get(agent.parent_agent_id) as any
      }

      // Get child agents
      const childAgents = db
        .prepare(
          `
        SELECT
          id, name, account_number, type, branch_name, is_active,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(t.amount), 0) as total_transaction_amount
        FROM agents a
        LEFT JOIN transactions t ON a.id = t.agent_id
        WHERE a.parent_agent_id = ?
        GROUP BY a.id
        ORDER BY a.name
      `
        )
        .all(agent.id) as any[]

      // Get recent transactions
      const recentTransactions = db
        .prepare(
          `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account_number
        FROM transactions t
        JOIN agents a ON t.agent_id = a.id
        WHERE t.agent_id = ?
        ORDER BY t.timestamp DESC
        LIMIT 10
      `
        )
        .all(agent.id) as any[]

      // Get transaction summary by type
      const transactionSummary = db
        .prepare(
          `
        SELECT
          type,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(commission_amount), 0) as total_commission
        FROM transactions
        WHERE agent_id = ?
        GROUP BY type
        ORDER BY total_amount DESC
      `
        )
        .all(agent.id) as any[]

      // Get monthly performance for the last 6 months
      const monthlyPerformance = db
        .prepare(
          `
        SELECT
          strftime('%Y-%m', timestamp) as month,
          COUNT(*) as transaction_count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(commission_amount), 0) as total_commission
        FROM transactions
        WHERE agent_id = ?
          AND timestamp >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', timestamp)
        ORDER BY month DESC
      `
        )
        .all(agent.id) as any[]

      res.status(200).json({
        success: true,
        data: {
          ...agent,
          is_active: Boolean(agent.is_active),
          parent_agent: parentAgent,
          child_agents: childAgents,
          recent_transactions: recentTransactions,
          transaction_summary: transactionSummary,
          monthly_performance: monthlyPerformance
        }
      })
    } else if (req.method === 'PUT') {
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
        return res.status(400).json({ message: 'Agent ID is required' })
      }

      // Check if agent exists and user has permission
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' })
      }

      // Apply role-based access control
      if (user.role === 'agent' && agent.id !== user.id) {
        return res.status(403).json({ message: 'Access denied' })
      }

      if (user.role === 'super_agent' || user.role === 'franchise') {
        // Get agents under this user
        const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
        if (userAgents.length > 0) {
          const agentIds = userAgents.map(a => a.id)
          if (!agentIds.includes(agent.id)) {
            return res.status(403).json({ message: 'Access denied' })
          }
        }
      }

      const {
        account_number,
        name,
        username,
        email,
        phone,
        contact,
        role,
        region,
        zone,
        type,
        branch_name,
        branch_code,
        is_active
      } = req.body

      // Update agent
      const updateQuery = `
        UPDATE agents
        SET account_number = COALESCE(?, account_number),
            name = COALESCE(?, name),
            username = COALESCE(?, username),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            contact = COALESCE(?, contact),
            role = COALESCE(?, role),
            region = COALESCE(?, region),
            zone = COALESCE(?, zone),
            type = COALESCE(?, type),
            branch_name = COALESCE(?, branch_name),
            branch_code = COALESCE(?, branch_code),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `

      const result = db
        .prepare(updateQuery)
        .run(
          account_number,
          name,
          username,
          email,
          phone,
          contact,
          role,
          region,
          zone,
          type,
          branch_name,
          branch_code,
          is_active !== undefined ? (is_active ? 1 : 0) : undefined,
          id
        )

      if (result.changes === 0) {
        return res.status(400).json({ message: 'No changes made to agent' })
      }

      // Get updated agent data
      const updatedAgent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any

      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent
      })
    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agent account API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process agent account request',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
