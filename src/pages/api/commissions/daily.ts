import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { agentId, type } = req.query
    const currentPeriod = new Date().toISOString().slice(0, 7)
    const currentDay = new Date().getDate()

    // Get daily transactions for current month
    const transactions = await prisma.transaction.groupBy({
      by: ['agentId'],
      where: {
        ...(agentId ? { agentId: parseInt(agentId as string) } : {}),
        ...(type === 'super_agent'
          ? {
              agent: { type: 'local_agent' }
            }
          : {}),
        timestamp: {
          gte: new Date(`${currentPeriod}-01`),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    // Calculate daily projections
    const projections = transactions.map(t => ({
      agentId: t.agentId,
      dailyAverage: (t._sum.amount || 0) / currentDay,
      projectedMonthly:
        ((t._sum.amount || 0) / currentDay) *
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
      currentAmount: t._sum.amount || 0,
      transactionCount: t._count.id || 0,
      daysElapsed: currentDay
    }))

    res.status(200).json({
      success: true,
      period: currentPeriod,
      day: currentDay,
      projections
    })
  } catch (error) {
    console.error('Daily projection error:', error)
    res.status(500).json({ error: 'Failed to calculate daily projections' })
  }
}
