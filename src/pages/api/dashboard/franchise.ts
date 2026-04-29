// src/pages/api/dashboard/franchise.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'
import { Prisma } from '@prisma/client'

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
      where: { id: decoded.id, isActive: true }
    })

    if (!user || user.role !== 'franchise') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if user has a linked account number
    if (!user.accountNumber) {
      return res.status(400).json({ message: 'No account linked to this user' })
    }

    const franchiseData = await getFranchiseData(user)

    res.status(200).json(franchiseData)
  } catch (error) {
    console.error('Franchise dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getFranchiseData(user: any) {
  // Find the agent by matching the user's accountNumber
  const franchise = await prisma.agent.findFirst({
    where: {
      accountNumber: user.accountNumber,
      type: 'franchise',
      isActive: 1
    }
  })

  if (!franchise) {
    throw new Error(`Franchise not found for account ${user.accountNumber}`)
  }

  const franchiseId = franchise.id

  // Get all child agents under this franchise (via parentAgentId)
  const childAgents = await prisma.agent.findMany({
    where: { parentAgentId: franchiseId, isActive: 1 },
    select: { id: true, type: true }
  })

  const totalAgentsCount = childAgents.length
  const superAgentsCount = childAgents.filter(a => a.type === 'super_agent').length
  const localAgentsCount = childAgents.filter(a => a.type === 'local_agent').length

  const childAgentIds = childAgents.map(a => a.id)

  // Get transactions for all child agents
  const transactionsData = await prisma.transaction.aggregate({
    where: {
      agentId: { in: childAgentIds },
      status: 'completed'
    },
    _count: { id: true },
    _sum: { amount: true }
  })

  // Get commission data
  const commissionData = await prisma.agent.aggregate({
    where: {
      parentAgentId: franchiseId,
      isActive: 1
    },
    _sum: { commissionAmount: true }
  })

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      agentId: { in: childAgentIds }
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

  // Monthly performance
  const monthlyPerformance = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
      COUNT(*)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(SUM(t."commission_amount"), 0)::numeric as "commissionEarned",
      COUNT(DISTINCT t."agent_id")::integer as "activeAgents"
    FROM "transactions" t
    WHERE t."agent_id" IN (${Prisma.join(childAgentIds)})
      AND t.status = 'completed'
    GROUP BY DATE_TRUNC('month', t."timestamp")
    ORDER BY DATE_TRUNC('month', t."timestamp") DESC
    LIMIT 6
  `

  // Zone performance
  const zonePerformance = await prisma.$queryRaw`
    SELECT
      COALESCE(a."branch_name", 'Unknown') as zone,
      COUNT(DISTINCT a.id)::integer as "agentsCount",
      COUNT(t.id)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(AVG(t."amount"), 0)::numeric as "averageTransaction"
    FROM "agents" a
    LEFT JOIN "transactions" t ON a.id = t."agent_id" AND t.status = 'completed'
    WHERE a."id" IN (${Prisma.join(childAgentIds)})
    GROUP BY a."branch_name"
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
        totalAmount: Number(transactionsData._sum?.amount || 0)
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
