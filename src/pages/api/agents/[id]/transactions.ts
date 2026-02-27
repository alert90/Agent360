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

    let transactions

    if ((agent as any).type === 'super_agent' || (agent as any).type === 'franchise') {
      // Get transactions for all associated agents
      transactions = db
        .prepare(
          `
        SELECT
          t.*,
          a.name as agent_name,
          a.account_number as agent_account_number
        FROM transactions t
        LEFT JOIN agents a ON t.agent_id = a.id
        WHERE t.agent_id = ?
           OR t.agent_id IN (
             SELECT local_agent_id FROM agent_assignments
             WHERE (super_agent_id = ? OR franchise_id = ?) AND status = 'active'
           )
        ORDER BY t.created_at DESC
        LIMIT 100
      `
        )
        .all(id as string, id as string, id as string)
    } else {
      // Get transactions for this specific agent by both ID and account number
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
        LIMIT 100
      `
        )
        .all(id as string, (agent as any).account_number)
    }

    res.status(200).json({
      success: true,
      data: transactions
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
