import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
    const user = userStmt.get(decoded.id) as any

    if (!user || user.role !== 'super_agent') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Get super agent data
    const superAgentData = await getSuperAgentData(user.id)

    res.status(200).json(superAgentData)
  } catch (error) {
    console.error('Super agent dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getSuperAgentData(userId: number) {
  // Find the super agent's agent record
  const superAgentStmt = db.prepare(`
    SELECT a.*, u.full_name, u.email
    FROM agents a
    JOIN users u ON a.id = u.id
    WHERE u.id = ? AND a.type = 'super_agent' AND a.is_active = 1
  `)
  const superAgent = superAgentStmt.get(userId) as any

  if (!superAgent) {
    throw new Error('Super agent record not found')
  }

  // Agents served by this super agent (local agents under them)
  const agentsServedStmt = db.prepare(`
    SELECT COUNT(*) as totalAgents
    FROM agents
    WHERE parent_agent_id = ? AND type = 'local_agent' AND is_active = 1
  `)
  const agentsServed = agentsServedStmt.get(superAgent.id) as any

  // Total transactions completed by agents under this super agent
  const transactionsCompletedStmt = db.prepare(`
    SELECT
      COUNT(*) as totalTransactions,
      SUM(t.amount) as totalAmount
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ? AND t.status = 'completed'
  `)
  const transactionsCompleted = transactionsCompletedStmt.get(superAgent.id) as any

  // Expected commission for this super agent
  const expectedCommissionStmt = db.prepare(`
    SELECT
      SUM(commission_amount) as expectedCommission,
      SUM(CASE WHEN commission_eligible = 1 THEN commission_amount ELSE 0 END) as liableCommission
    FROM agents
    WHERE parent_agent_id = ? AND is_active = 1
  `)
  const commissionData = expectedCommissionStmt.get(superAgent.id) as any

  // Recent transactions by agents under this super agent
  const recentTransactionsStmt = db.prepare(`
    SELECT
      t.id,
      t.transaction_id,
      t.agent_name,
      t.customer_name,
      t.type,
      t.amount,
      t.status,
      t.timestamp,
      a.name as agent_name_full,
      a.branch_name
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ?
    ORDER BY t.timestamp DESC
    LIMIT 10
  `)
  const recentTransactions = recentTransactionsStmt.all(superAgent.id) as any[]

  // Monthly performance data
  const monthlyPerformanceStmt = db.prepare(`
    SELECT
      strftime('%Y-%m', t.timestamp) as month,
      COUNT(*) as transactionCount,
      SUM(t.amount) as totalAmount,
      SUM(CASE WHEN t.commission_eligible = 1 THEN t.commission_amount ELSE 0 END) as commissionEarned
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ? AND t.status = 'completed'
    GROUP BY strftime('%Y-%m', t.timestamp)
    ORDER BY month DESC
    LIMIT 6
  `)
  const monthlyPerformance = monthlyPerformanceStmt.all(superAgent.id) as any[]

  // Agent performance under this super agent
  const agentPerformanceStmt = db.prepare(`
    SELECT
      a.id,
      a.name,
      a.account_number,
      a.branch_name,
      COUNT(t.id) as transactionCount,
      SUM(t.amount) as totalAmount,
      SUM(CASE WHEN t.commission_eligible = 1 THEN t.commission_amount ELSE 0 END) as commissionEarned
    FROM agents a
    LEFT JOIN transactions t ON a.id = t.agent_id AND t.status = 'completed'
    WHERE a.parent_agent_id = ? AND a.type = 'local_agent' AND a.is_active = 1
    GROUP BY a.id, a.name, a.account_number, a.branch_name
    ORDER BY totalAmount DESC
    LIMIT 10
  `)
  const agentPerformance = agentPerformanceStmt.all(superAgent.id) as any[]

  return {
    superAgent: {
      id: superAgent.id,
      name: superAgent.name,
      accountNumber: superAgent.accountNumber,
      branchName: superAgent.branch_name,
      totalCommission: superAgent.commission_amount,
      payband: superAgent.payband
    },
    summary: {
      agentsServed: agentsServed?.totalAgents || 0,
      totalTransactions: transactionsCompleted?.totalTransactions || 0,
      totalAmount: transactionsCompleted?.totalAmount || 0,
      expectedCommission: commissionData?.expectedCommission || 0,
      liableCommission: commissionData?.liableCommission || 0
    },
    recentTransactions,
    monthlyPerformance,
    agentPerformance
  }
}
