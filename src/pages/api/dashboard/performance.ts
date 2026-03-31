import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const [totalTransactions, totalAmountRaw, totalAgents, activeAgents] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { isActive: 1 } })
    ])

    const totalAmount = Number(totalAmountRaw._sum?.amount || 0)

    // Monthly trends (last 12 months)
    const monthlyTrends = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "timestamp"), 'YYYY-MM') as month,
        COUNT(*)::integer as transactions,
        COALESCE(SUM("amount"), 0)::numeric as "totalAmount",
        COALESCE(AVG("amount"), 0)::numeric as "avgAmount"
      FROM "transactions"
      WHERE "timestamp" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "timestamp")
      ORDER BY DATE_TRUNC('month', "timestamp") DESC
    `

    // Top performing agents (last 30 days)
    const topAgents = await prisma.$queryRaw`
      SELECT
        a.id,
        a.name,
        a."accountNumber",
        COUNT(t.id)::integer as "transactionCount",
        COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
        COALESCE(AVG(t."amount"), 0)::numeric as "avgAmount"
      FROM "agents" a
      LEFT JOIN "transactions" t ON a.id = t."agentId" AND t."timestamp" >= NOW() - INTERVAL '30 days' AND t.status = 'completed'
      WHERE a."isActive" = 1
      GROUP BY a.id, a.name, a."accountNumber"
      ORDER BY "totalAmount" DESC
      LIMIT 10
    `

    // Transaction types breakdown (last 30 days)
    const transactionTypes = await prisma.$queryRaw`
      SELECT
        type,
        COUNT(*)::integer as count,
        COALESCE(SUM("amount"), 0)::numeric as total
      FROM "transactions"
      WHERE "timestamp" >= NOW() - INTERVAL '30 days'
      GROUP BY type
      ORDER BY total DESC
    `

    // Zone performance (last 30 days)
    const zonePerformance = await prisma.$queryRaw`
      SELECT
        "zone",
        COUNT(*)::integer as transactions,
        COALESCE(SUM("amount"), 0)::numeric as "totalAmount"
      FROM "transactions"
      WHERE "timestamp" >= NOW() - INTERVAL '30 days' AND "zone" IS NOT NULL
      GROUP BY "zone"
      ORDER BY "totalAmount" DESC
    `

    // Commission summary (last 6 months) - using commissions table
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let commissionSummary = {
      calculations: 0,
      totalCommission: 0,
      avgCommission: 0
    }

    // Check if commissions table exists and has data
    try {
      const commissionResult = await prisma.commission.aggregate({
        where: {
          createdAt: { gte: sixMonthsAgo }
        },
        _count: {
          id: true
        },
        _sum: {
          finalCommission: true
        },
        _avg: {
          finalCommission: true
        }
      })

      commissionSummary = {
        calculations: commissionResult._count.id || 0,
        totalCommission: Number(commissionResult._sum?.finalCommission || 0),
        avgCommission: Number(commissionResult._avg?.finalCommission || 0)
      }
    } catch (error) {
      console.log('Commissions table not yet populated')
    }

    const performance = {
      overview: {
        totalTransactions,
        totalAmount,
        totalAgents,
        activeAgents,
        avgTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0
      },
      trends: {
        monthly: monthlyTrends
      },
      topAgents,
      transactionTypes,
      zonePerformance,
      commissions: commissionSummary
    }

    return res.status(200).json(performance)
  } catch (error) {
    console.error('Performance API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch performance data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
