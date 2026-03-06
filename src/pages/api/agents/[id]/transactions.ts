import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  // Pagination parameters with sensible defaults
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 1000 // Default to 1000, can be increased
  const offset = (page - 1) * limit

  const db = new Database('agent360.db')

  try {
    // First get the agent to determine if it's a super agent or franchise and get account number
    const agent = db
      .prepare(
        `
      SELECT id, type, account_number, name FROM agents WHERE id = ?
    `
      )
      .get(id as string)

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    let transactions: any[]
    let totalCount = 0

    if ((agent as any).type === 'super_agent' || (agent as any).type === 'franchise') {
      // Get transactions for all associated agents (including their account numbers)

      // First, get all account numbers from agents under this super_agent/franchise
      const associatedAgents = db
        .prepare(
          `
        SELECT a.id, a.account_number FROM agents a
        WHERE a.id = ?
           OR a.id IN (
             SELECT local_agent_id FROM agent_assignments
             WHERE (super_agent_id = ? OR franchise_id = ?) AND status = 'active'
           )
      `
        )
        .all(id as string, id as string, id as string) as any[]

      const agentIds = associatedAgents.map((a: any) => a.id)
      const accountNumbers = associatedAgents.map((a: any) => a.account_number).filter(Boolean)

      if (agentIds.length === 0) {
        transactions = []
      } else {
        // Build query to match by agent_id OR account_number
        // Get the agent's own account number too
        const allAccountNumbers = [
          ...new Set([...((agent as any).account_number ? [(agent as any).account_number] : []), ...accountNumbers])
        ]

        // Count total transactions matching any of the criteria
        const countResult = db
          .prepare(
            `
          SELECT COUNT(*) as count FROM transactions t
          LEFT JOIN agents a ON t.agent_id = a.id
          WHERE t.agent_id IN (${agentIds.map(() => '?').join(',')})
             OR a.account_number IN (${allAccountNumbers.map(() => '?').join(',')})
        `
          )
          .get(...agentIds, ...allAccountNumbers) as { count: number }

        totalCount = countResult.count

        // Get paginated transactions
        transactions = db
          .prepare(
            `
          SELECT
            t.*,
            a.name as agent_name,
            a.account_number as agent_account_number
          FROM transactions t
          LEFT JOIN agents a ON t.agent_id = a.id
          WHERE t.agent_id IN (${agentIds.map(() => '?').join(',')})
             OR a.account_number IN (${allAccountNumbers.map(() => '?').join(',')})
          ORDER BY t.created_at DESC
          LIMIT ? OFFSET ?
        `
          )
          .all(...agentIds, ...allAccountNumbers, limit, offset)
      }
    } else {
      // For regular agents, match by both agent_id AND account_number
      const accountNumber = (agent as any).account_number

      // Count total matching transactions
      const countResult = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        WHERE t.agent_id = ? OR a.account_number = ?
      `
        )
        .get(id as string, accountNumber) as { count: number }

      totalCount = countResult.count

      // Get paginated transactions
      transactions = db
        .prepare(
          `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account_number
        FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        WHERE t.agent_id = ? OR a.account_number = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(id as string, accountNumber, limit, offset)
    }

    // Calculate totals from the data
    const totalAmount = transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0)

    // Group by transaction type for summary
    const typeSummary: Record<string, { count: number; amount: number }> = {}
    transactions.forEach((tx: any) => {
      const type = tx.type || 'UNKNOWN'
      if (!typeSummary[type]) {
        typeSummary[type] = { count: 0, amount: 0 }
      }
      typeSummary[type].count++
      typeSummary[type].amount += tx.amount || 0
    })

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalTransactions: totalCount,
        totalAmount,
        byType: Object.entries(typeSummary).map(([type, data]) => ({
          type,
          count: data.count,
          amount: data.amount
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
