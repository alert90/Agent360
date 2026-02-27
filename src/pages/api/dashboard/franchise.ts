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

    if (!user || user.role !== 'franchise') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Get franchise data
    const franchiseData = await getFranchiseData(user.id)

    res.status(200).json(franchiseData)
  } catch (error) {
    console.error('Franchise dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getFranchiseData(userId: number) {
  // Find the franchise's agent record
  const franchiseStmt = db.prepare(`
    SELECT a.*, u.full_name, u.email
    FROM agents a
    JOIN users u ON a.id = u.id
    WHERE u.id = ? AND a.type = 'franchise' AND a.is_active = 1
  `)
  const franchise = franchiseStmt.get(userId) as any

  if (!franchise) {
    throw new Error('Franchise record not found')
  }

  // Agents served/connected to this franchise (super agents and local agents under them)
  const agentsServedStmt = db.prepare(`
    SELECT
      COUNT(CASE WHEN type = 'super_agent' THEN 1 END) as superAgents,
      COUNT(CASE WHEN type = 'local_agent' THEN 1 END) as localAgents,
      COUNT(*) as totalAgents
    FROM agents
    WHERE parent_agent_id = ? AND is_active = 1
  `)
  const agentsServed = agentsServedStmt.get(franchise.id) as any

  // Total transactions by this franchise (through all agents under it)
  const transactionsStmt = db.prepare(`
    SELECT
      COUNT(*) as totalTransactions,
      SUM(t.amount) as totalAmount,
      SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as completedAmount
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ? AND t.status = 'completed'
  `)
  const transactionsData = transactionsStmt.get(franchise.id) as any

  // Commission data for this franchise
  const commissionStmt = db.prepare(`
    SELECT
      SUM(commission_amount) as totalCommission,
      SUM(CASE WHEN commission_eligible = 1 THEN commission_amount ELSE 0 END) as eligibleCommission
    FROM agents
    WHERE parent_agent_id = ? AND is_active = 1
  `)
  const commissionData = commissionStmt.get(franchise.id) as any

  // Recent transactions by agents under this franchise
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
      a.type as agent_type,
      a.branch_name
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ?
    ORDER BY t.timestamp DESC
    LIMIT 15
  `)
  const recentTransactions = recentTransactionsStmt.all(franchise.id) as any[]

  // Monthly performance data
  const monthlyPerformanceStmt = db.prepare(`
    SELECT
      strftime('%Y-%m', t.timestamp) as month,
      COUNT(*) as transactionCount,
      SUM(t.amount) as totalAmount,
      SUM(CASE WHEN t.commission_eligible = 1 THEN t.commission_amount ELSE 0 END) as commissionEarned,
      COUNT(DISTINCT t.agent_id) as activeAgents
    FROM transactions t
    JOIN agents a ON t.agent_id = a.id
    WHERE a.parent_agent_id = ? AND t.status = 'completed'
    GROUP BY strftime('%Y-%m', t.timestamp)
    ORDER BY month DESC
    LIMIT 6
  `)
  const monthlyPerformance = monthlyPerformanceStmt.all(franchise.id) as any[]

  // Super agent performance under this franchise
  const superAgentPerformanceStmt = db.prepare(`
    SELECT
      a.id,
      a.name,
      a.account_number,
      a.branch_name,
      COUNT(DISTINCT sa.id) as localAgentsUnder,
      COUNT(t.id) as transactionCount,
      SUM(t.amount) as totalAmount,
      SUM(CASE WHEN t.commission_eligible = 1 THEN t.commission_amount ELSE 0 END) as commissionEarned
    FROM agents a
    LEFT JOIN agents sa ON sa.parent_agent_id = a.id AND sa.type = 'local_agent' AND sa.is_active = 1
    LEFT JOIN transactions t ON sa.id = t.agent_id AND t.status = 'completed'
    WHERE a.parent_agent_id = ? AND a.type = 'super_agent' AND a.is_active = 1
    GROUP BY a.id, a.name, a.account_number, a.branch_name
    ORDER BY totalAmount DESC
  `)
  const superAgentPerformance = superAgentPerformanceStmt.all(franchise.id) as any[]

  // Zone/branch performance under this franchise
  const zonePerformanceStmt = db.prepare(`
    SELECT
      COALESCE(a.branch_name, 'Unknown') as zone,
      COUNT(DISTINCT a.id) as agentsCount,
      COUNT(t.id) as transactionCount,
      SUM(t.amount) as totalAmount,
      AVG(t.amount) as averageTransaction
    FROM agents a
    LEFT JOIN transactions t ON a.id = t.agent_id AND t.status = 'completed'
    WHERE a.parent_agent_id = ?
    GROUP BY a.branch_name
    ORDER BY totalAmount DESC
  `)
  const zonePerformance = zonePerformanceStmt.all(franchise.id) as any[]

  return {
    franchise: {
      id: franchise.id,
      name: franchise.name,
      accountNumber: franchise.accountNumber,
      branchName: franchise.branch_name,
      totalCommission: franchise.commission_amount,
      payband: franchise.payband
    },
    summary: {
      agentsServed: {
        superAgents: agentsServed?.superAgents || 0,
        localAgents: agentsServed?.localAgents || 0,
        totalAgents: agentsServed?.totalAgents || 0
      },
      transactions: {
        totalTransactions: transactionsData?.totalTransactions || 0,
        totalAmount: transactionsData?.totalAmount || 0,
        completedAmount: transactionsData?.completedAmount || 0
      },
      commission: {
        expectedCommission: commissionData?.totalCommission || 0,
        totalCommission: commissionData?.eligibleCommission || 0
      }
    },
    recentTransactions,
    monthlyPerformance,
    superAgentPerformance,
    zonePerformance
  }
}
