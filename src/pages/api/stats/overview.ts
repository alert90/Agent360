import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      // Get total agents
      const agentsCount = db.prepare('SELECT COUNT(*) as count FROM agents WHERE is_active = 1').get() as any

      // Get total transactions
      const transactionsCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any

      // Get total amounts
      const totalAmounts = db
        .prepare(
          `
        SELECT
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(AVG(amount), 0) as avg_amount
        FROM transactions
      `
        )
        .get() as any

      // Get total commissions
      const totalCommissions = db
        .prepare('SELECT COALESCE(SUM(commission_amount), 0) as total FROM transactions')
        .get() as any

      // Get top performing agent
      const topAgentQuery = `
        SELECT
          a.name,
          a.account_number,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(t.amount), 0) as total_amount
        FROM agents a
        LEFT JOIN transactions t ON a.id = t.agent_id
        WHERE a.is_active = 1
        GROUP BY a.id
        ORDER BY total_amount DESC
        LIMIT 1
      `
      const topAgent = db.prepare(topAgentQuery).get() as any

      // Get recent activity (last 7 days)
      const recentActivityQuery = `
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as total_amount
        FROM transactions
        WHERE DATE(timestamp) >= DATE('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `
      const recentActivity = db.prepare(recentActivityQuery).all() as any[]

      // Get total users count
      const usersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any

      // Get active users count
      const activeUsersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any

      // Get active agents count
      const activeAgentsCount = db.prepare('SELECT COUNT(*) as count FROM agents WHERE is_active = 1').get() as any

      // Calculate percentages
      const userPercentage = usersCount?.count > 0 ? Math.round((activeUsersCount?.count / usersCount?.count) * 100) : 0
      const agentPercentage =
        agentsCount?.count > 0 ? Math.round((activeAgentsCount?.count / agentsCount?.count) * 100) : 0
      const transactionPercentage =
        transactionsCount?.count > 0 ? Math.round((transactionsCount?.count / transactionsCount?.count) * 100) : 0
      const commissionPercentage =
        totalAmounts?.total_amount > 0 ? Math.round((totalCommissions?.total / totalAmounts?.total_amount) * 100) : 0

      const stats = {
        users: {
          total: usersCount?.count || 0,
          active: activeUsersCount?.count || 0,
          percentage: `${userPercentage}%`
        },
        agents: {
          total: agentsCount?.count || 0,
          active: activeAgentsCount?.count || 0,
          percentage: `${agentPercentage}%`
        },
        transactions: {
          total: transactionsCount?.count || 0,
          percentage: `${transactionPercentage}%`
        },
        commissions: {
          total: totalCommissions?.total || 0,
          percentage: `${commissionPercentage}%`
        },
        totalAmount: totalAmounts?.total_amount || 0,
        avgTransactionAmount: totalAmounts?.avg_amount || 0,
        topPerformingAgent: topAgent
          ? {
              name: topAgent.name,
              accountNumber: topAgent.account_number,
              transactions: topAgent.transaction_count,
              amount: topAgent.total_amount
            }
          : null,
        recentActivity: recentActivity.map(activity => ({
          date: activity.date,
          transactions: activity.transactions,
          amount: activity.total_amount
        }))
      }

      res.status(200).json({
        success: true,
        data: stats
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Stats overview API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
