import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const assignments = db
      .prepare(
        `
      SELECT
        aa.*,
        la.name as local_agent_name,
        la.account_number as local_agent_account_number,
        sa.name as super_agent_name,
        sa.account_number as super_agent_account_number,
        f.name as franchise_name,
        f.account_number as franchise_account_number,
        u.name as assigned_by_name
      FROM agent_assignments aa
      LEFT JOIN agents la ON aa.local_agent_id = la.id
      LEFT JOIN agents sa ON aa.super_agent_id = sa.id
      LEFT JOIN agents f ON aa.franchise_id = f.id
      LEFT JOIN users u ON aa.assigned_by = u.id
      WHERE aa.status = 'active'
      ORDER BY aa.assigned_at DESC
    `
      )
      .all()

    res.status(200).json({
      success: true,
      data: assignments
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
