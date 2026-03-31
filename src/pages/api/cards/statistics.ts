import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get user statistics from database
    const userCount = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } }) // Changed from 1 to true for Boolean
    const transactionCount = await prisma.transaction.count()

    // Get agent statistics
    const agentCount = await prisma.agent.count()
    const activeAgents = await prisma.agent.count({ where: { isActive: 1 } })

    // Get commission statistics
    const commissionCount = await prisma.commission.count()
    const totalCommissionResult = await prisma.commission.aggregate({
      _sum: { finalCommission: true }
    })
    const totalCommission = totalCommissionResult._sum.finalCommission || 0

    const stats = {
      statsHorizontalWithDetails: [
        {
          title: 'Total Users',
          stats: userCount,
          change: activeUsers,
          subtitle: 'Active Users',
          color: 'primary',
          icon: 'tabler:users'
        },
        {
          title: 'Total Agents',
          stats: agentCount,
          change: activeAgents,
          subtitle: 'Active Agents',
          color: 'success',
          icon: 'tabler:user-check'
        },
        {
          title: 'Transactions',
          stats: transactionCount,
          change: Math.round((transactionCount * 100) / Math.max(userCount, 1)),
          subtitle: 'Per User',
          color: 'warning',
          icon: 'tabler:exchange'
        },
        {
          title: 'Total Commission',
          stats: Math.round(totalCommission),
          change: commissionCount,
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
  }
}
