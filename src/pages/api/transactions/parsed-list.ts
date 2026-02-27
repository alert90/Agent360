// api/transactions/parsed-list.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

interface Transaction {
  id: number
  transactionId: string
  reference: string
  agentName: string
  amount: number
  type: string
  status: string
  timestamp: string
  narration: string
  location: string
  commissionAmount: number
  fee: number
  netAmount: number
  customerName: string
  customerAccount: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  totalTransactions: number
  totalAmount: number
  totalCommission: number
  avgTransactionAmount: number
}

interface AgentFilter {
  value: string
  label: string
}

interface ApiResponse {
  success: boolean
  data: Transaction[]
  pagination: Pagination
  stats: Stats
  filters?: {
    agents: AgentFilter[]
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { message: string }>) {
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

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const {
      search = '',
      page = '1',
      limit = '25',
      type = '',
      status = '',
      startDate = '',
      endDate = '',
      agent = ''
    } = req.query

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Role-based filtering
    if (user.role === 'agent') {
      whereClause += ' AND agent_id = ?'
      params.push(user.id)
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id)
        whereClause += ` AND agent_id IN (${agentIds.join(',')})`
      } else {
        whereClause += ' AND 1=0'
      }
    }

    // Search filter
    if (search) {
      whereClause += ' AND (reference LIKE ? OR agent_name LIKE ? OR narration LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Type filter
    if (type && type !== 'all') {
      whereClause += ' AND type = ?'
      params.push(type)
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    // Agent filter
    if (agent && agent !== 'all') {
      whereClause += ' AND agent_name LIKE ?'
      params.push(`%${agent}%`)
    }

    // Date range filter
    if (startDate) {
      whereClause += ' AND timestamp >= ?'
      params.push(startDate)
    }
    if (endDate) {
      whereClause += ' AND timestamp <= ?'
      params.push(endDate)
    }

    // Get transactions
    const transactionsQuery = `
      SELECT
        id,
        transaction_id as transactionId,
        reference,
        agent_name as agentName,
        amount,
        type,
        status,
        timestamp,
        narration,
        location,
        commission_amount as commissionAmount,
        fee,
        net_amount as netAmount,
        customer_name as customerName,
        customer_account as customerAccount
      FROM transactions
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `

    const transactions = db
      .prepare(transactionsQuery)
      .all(...params, parseInt(limit as string), offset) as Transaction[]

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      ${whereClause}
    `
    const countResult = db.prepare(countQuery).get(...params) as { total: number }
    const total = countResult?.total || 0

    // Get unique agents for filter
    const agentsQuery = `
      SELECT DISTINCT agent_name
      FROM transactions
      WHERE agent_name IS NOT NULL AND agent_name != ''
      ORDER BY agent_name
    `
    const agents = db.prepare(agentsQuery).all() as { agent_name: string }[]

    // Calculate statistics
    const statsQuery = `
      SELECT
        COUNT(*) as totalTransactions,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COALESCE(AVG(amount), 0) as avgTransactionAmount
      FROM transactions
      ${whereClause}
    `
    const stats = db.prepare(statsQuery).get(...params) as Stats

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      },
      stats: {
        totalTransactions: stats.totalTransactions || 0,
        totalAmount: stats.totalAmount || 0,
        totalCommission: stats.totalCommission || 0,
        avgTransactionAmount: stats.avgTransactionAmount || 0
      },
      filters: {
        agents: agents.map(a => ({ value: a.agent_name, label: a.agent_name }))
      }
    })
  } catch (error) {
    console.error('Parsed transactions list API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as any)
  } finally {
    db.close()
  }
}
