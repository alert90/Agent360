import type { NextApiRequest, NextApiResponse } from 'next/types'
import { initializeDatabase } from '../../lib/initDb'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Initialize database
    await initializeDatabase()

    // Check if we have data
    const db = new Database('agent360.db')
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }
    const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }
    const commissionCount = db.prepare('SELECT COUNT(*) as count FROM commission_calculations').get() as {
      count: number
    }
    db.close()

    return res.status(200).json({
      message: 'Database initialized successfully',
      data: {
        transactions: transactionCount.count,
        agents: agentCount.count,
        commissions: commissionCount.count
      }
    })
  } catch (error) {
    console.error('Database initialization error:', error)

    return res.status(500).json({
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
