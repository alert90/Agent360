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
    const associatedAgents = db
      .prepare(
        `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.type,
        a.is_active,
        aa.assigned_at,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM agents a
      LEFT JOIN agent_assignments aa ON a.id = aa.local_agent_id
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE (aa.super_agent_id = ? OR aa.franchise_id = ?)
        AND aa.status = 'active'
      GROUP BY a.id, a.name, a.account_number, a.type, a.is_active, aa.assigned_at
      ORDER BY aa.assigned_at DESC
    `
      )
      .all(id as string, id as string)

    res.status(200).json({
      success: true,
      data: associatedAgents
    })
  } catch (error) {
    console.error('Error fetching associated agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch associated agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
