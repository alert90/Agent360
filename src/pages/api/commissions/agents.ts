import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const agents = db
      .prepare(
        `
      SELECT id, name, account_number, type, is_active, parent_agent_id
      FROM agents
      ORDER BY type, name
    `
      )
      .all()

    res.status(200).json({
      success: true,
      data: agents
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
