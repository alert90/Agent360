import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const templates = db
      .prepare(
        `
      SELECT * FROM commission_configs
      ORDER BY created_at DESC
    `
      )
      .all()

    res.status(200).json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching commission templates:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
