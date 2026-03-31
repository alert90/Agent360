import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get total agents
      const agentsCount = await prisma.agent.count({ where: { isActive: 1 } })

      // Get total transactions
      const transactionsCount = await prisma.transaction.count()

      // Get total amounts
      const totalAmounts = await prisma.transaction.aggregate({
        _sum: { amount: true },
        _avg: { amount: true }
      })

      // Get total commissions
      const totalCommissions = await prisma.transaction.aggregate({
        _sum: { commissionAmount: true }
      })

      // Get top performing agent using raw query
      const topAgent = await prisma.$queryRawUnsafe(`
        SELECT
          a.name,
          a.account_number as "accountNumber",
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(t.amount), 0)::numeric as total_amount
        FROM agents a
        LEFT JOIN transactions t ON a.id = t.agent_id
        WHERE a.is_active = 1
        GROUP BY a.id
        ORDER BY total_amount DESC
        LIMIT 1
      `)

      // Get recent activity (last 7 days)
      const recentActivity = await prisma.$queryRawUnsafe(`
        SELECT
          DATE(timestamp) as date,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(amount), 0)::numeric as total_amount
        FROM transactions
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `)

      // Get total users count
      const usersCount = await prisma.user.count({ where: { isActive: true } })

      // Get active users count
      const activeUsersCount = await prisma.user.count({ where: { isActive: true } })

      // Get active agents count
      const activeAgentsCount = await prisma.agent.count({ where: { isActive: 1 } })

      // Calculate percentages
      const userPercentage = usersCount > 0 ? Math.round((activeUsersCount / usersCount) * 100) : 0
      const agentPercentage = agentsCount > 0 ? Math.round((activeAgentsCount / agentsCount) * 100) : 0
      const transactionPercentage = transactionsCount > 0 ? 100 : 0
      const commissionPercentage =
        (totalAmounts._sum.amount || 0) > 0
          ? Math.round(((totalCommissions._sum.commissionAmount || 0) / Number(totalAmounts._sum.amount)) * 100)
          : 0

      const topAgentData = Array.isArray(topAgent) && topAgent.length > 0 ? topAgent[0] : null

      const stats = {
        users: {
          total: usersCount || 0,
          active: activeUsersCount || 0,
          percentage: `${userPercentage}%`
        },
        agents: {
          total: agentsCount || 0,
          active: activeAgentsCount || 0,
          percentage: `${agentPercentage}%`
        },
        transactions: {
          total: transactionsCount || 0,
          percentage: `${transactionPercentage}%`
        },
        commissions: {
          total: totalCommissions._sum.commissionAmount || 0,
          percentage: `${commissionPercentage}%`
        },
        totalAmount: totalAmounts._sum.amount || 0,
        avgTransactionAmount: totalAmounts._avg.amount || 0,
        topPerformingAgent: topAgentData
          ? {
              name: topAgentData.name,
              accountNumber: topAgentData.accountNumber,
              transactions: Number(topAgentData.transaction_count),
              amount: Number(topAgentData.total_amount)
            }
          : null,
        recentActivity: Array.isArray(recentActivity)
          ? recentActivity.map((activity: any) => ({
              date: activity.date,
              transactions: Number(activity.transactions),
              amount: Number(activity.total_amount)
            }))
          : []
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
  }
}
