import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        isActive: true
      }
    })

    if (!user || user.role !== 'franchise') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const franchiseData = await getFranchiseData(decoded.id)

    res.status(200).json(franchiseData)
  } catch (error) {
    console.error('Franchise dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getFranchiseData(userId: number) {
  const franchise = await prisma.agent.findFirst({
    where: {
      id: userId,
      type: 'franchise',
      isActive: 1
    }
  })

  if (!franchise) {
    throw new Error('Franchise record not found')
  }

  const franchiseId = franchise.id

  const [superAgentsCount, localAgentsCount, totalAgentsCount] = await Promise.all([
    prisma.agent.count({ where: { parentAgentId: franchiseId, type: 'super_agent', isActive: 1 } }),
    prisma.agent.count({ where: { parentAgentId: franchiseId, type: 'local_agent', isActive: 1 } }),
    prisma.agent.count({ where: { parentAgentId: franchiseId, isActive: 1 } })
  ])

  const transactionsData = await prisma.transaction.aggregate({
    where: {
      agent: {
        parentAgentId: franchiseId
      },
      status: 'completed'
    },
    _count: { id: true },
    _sum: { amount: true }
  })

  const commissionData = await prisma.agent.aggregate({
    where: {
      parentAgentId: franchiseId,
      isActive: 1
    },
    _sum: { commissionAmount: true }
  })

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      agent: {
        parentAgentId: franchiseId
      }
    },
    include: {
      agent: {
        select: {
          name: true,
          type: true,
          branchName: true
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 15
  })

  const monthlyPerformance = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
      COUNT(*)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(SUM(CASE WHEN t."commissionEligible" = true THEN t."commissionAmount" ELSE 0 END), 0)::numeric as "commissionEarned",
      COUNT(DISTINCT t."agentId")::integer as "activeAgents"
    FROM "transactions" t
    JOIN "agents" a ON t."agentId" = a.id
    WHERE a."parentAgentId" = ${franchiseId} AND t.status = 'completed'
    GROUP BY DATE_TRUNC('month', t."timestamp")
    ORDER BY DATE_TRUNC('month', t."timestamp") DESC
    LIMIT 6
  `

  const zonePerformance = await prisma.$queryRaw`
    SELECT
      COALESCE(a."branchName", 'Unknown') as zone,
      COUNT(DISTINCT a.id)::integer as "agentsCount",
      COUNT(t.id)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(AVG(t."amount"), 0)::numeric as "averageTransaction"
    FROM "agents" a
    LEFT JOIN "transactions" t ON a.id = t."agentId" AND t.status = 'completed'
    WHERE a."parentAgentId" = ${franchiseId}
    GROUP BY a."branchName"
    ORDER BY "totalAmount" DESC
  `

  return {
    franchise: {
      id: franchise.id,
      name: franchise.name,
      accountNumber: franchise.accountNumber,
      branchName: franchise.branchName,
      totalCommission: franchise.commissionAmount,
      payband: franchise.payband
    },
    summary: {
      agentsServed: {
        superAgents: superAgentsCount,
        localAgents: localAgentsCount,
        totalAgents: totalAgentsCount
      },
      transactions: {
        totalTransactions: transactionsData._count.id || 0,
        totalAmount: Number(transactionsData._sum?.amount || 0),
        completedAmount: Number(transactionsData._sum?.amount || 0)
      },
      commission: {
        expectedCommission: Number(commissionData._sum?.commissionAmount || 0),
        totalCommission: Number(commissionData._sum?.commissionAmount || 0)
      }
    },
    recentTransactions,
    monthlyPerformance,
    zonePerformance
  }
}
