import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Get user statistics from database
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as { count: number }
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }
    const totalAmount = db.prepare('SELECT SUM(amount) as total FROM transactions').get() as { total: number }

    // Get agent statistics
    const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }
    const activeAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE is_active = 1').get() as {
      count: number
    }

    // Get commission statistics
    const commissionCount = db.prepare('SELECT COUNT(*) as count FROM commission_calculations').get() as {
      count: number
    }
    const totalCommission = db.prepare('SELECT SUM(final_commission) as total FROM commission_calculations').get() as {
      total: number
    }

    const stats = {
      statsHorizontalWithDetails: [
        {
          title: 'Total Users',
          stats: userCount.count,
          change: activeUsers.count,
          subtitle: 'Active Users',
          color: 'primary',
          icon: 'tabler:users'
        },
        {
          title: 'Total Agents',
          stats: agentCount.count,
          change: activeAgents.count,
          subtitle: 'Active Agents',
          color: 'success',
          icon: 'tabler:user-check'
        },
        {
          title: 'Transactions',
          stats: transactionCount.count,
          change: Math.round((transactionCount.count * 100) / Math.max(userCount.count, 1)),
          subtitle: 'Per User',
          color: 'warning',
          icon: 'tabler:exchange'
        },
        {
          title: 'Total Commission',
          stats: Math.round(totalCommission?.total || 0),
          change: commissionCount.count,
          subtitle: 'Calculations',
          color: 'info',
          icon: 'tabler:coin'
        }
      ]
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Cards statistics error:', error)

    return res.status(500).json({
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
