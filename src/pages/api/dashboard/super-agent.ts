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

    if (!user || user.role !== 'super_agent') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const superAgentData = await getSuperAgentData(decoded.id)

    res.status(200).json(superAgentData)
  } catch (error) {
    console.error('Super agent dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getSuperAgentData(userId: number) {
  const superAgent = await prisma.agent.findFirst({
    where: {
      id: userId,
      type: 'super_agent',
      isActive: 1
    },
    include: {
      parentAgent: true
    }
  })

  if (!superAgent) {
    throw new Error('Super agent record not found')
  }

  const superAgentId = superAgent.id

  const agentsServed = await prisma.agent.count({
    where: {
      parentAgentId: superAgentId,
      type: 'local_agent',
      isActive: 1
    }
  })

  const transactionsCompleted = await prisma.transaction.aggregate({
    where: {
      agent: {
        parentAgentId: superAgentId
      },
      status: 'completed'
    },
    _count: {
      id: true
    },
    _sum: {
      amount: true
    }
  })

  const commissionData = await prisma.agent.aggregate({
    where: {
      parentAgentId: superAgentId,
      isActive: 1
    },
    _sum: {
      commissionAmount: true
    }
  })

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      agent: {
        parentAgentId: superAgentId
      }
    },
    include: {
      agent: {
        select: {
          name: true,
          branchName: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 10
  })

  const monthlyPerformance = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
      COUNT(*)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(SUM(CASE WHEN t."commissionEligible" = true THEN t."commissionAmount" ELSE 0 END), 0)::numeric as "commissionEarned"
    FROM "transactions" t
    JOIN "agents" a ON t."agentId" = a.id
    WHERE a."parentAgentId" = ${superAgentId} AND t.status = 'completed'
    GROUP BY DATE_TRUNC('month', t."timestamp")
    ORDER BY DATE_TRUNC('month', t."timestamp") DESC
    LIMIT 6
  `

  const agentPerformance = await prisma.agent.findMany({
    where: {
      parentAgentId: superAgentId,
      type: 'local_agent',
      isActive: 1
    },
    orderBy: {
      totalTransactionAmount: 'desc'
    },
    take: 10,
    include: {
      transactions: {
        where: {
          status: 'completed'
        },
        take: 100 // Limit to avoid huge data
      }
    }
  })

  const processedAgentPerformance = agentPerformance.map(agent => {
    const totalAmount = agent.transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    const commissionEarned = agent.transactions.reduce((sum, tx) => {
      return sum + (tx.commissionEligible ? Number(tx.commissionAmount || 0) : 0)
    }, 0)

    return {
      id: agent.id,
      name: agent.name,
      accountNumber: agent.accountNumber,
      branchName: agent.branchName,
      transactionCount: agent.transactions.length,
      totalAmount,
      commissionEarned
    }
  })

  return {
    superAgent: {
      id: superAgent.id,
      name: superAgent.name,
      accountNumber: superAgent.accountNumber,
      branchName: superAgent.branchName,
      totalCommission: superAgent.commissionAmount,
      payband: superAgent.payband
    },
    summary: {
      agentsServed,
      totalTransactions: transactionsCompleted._count.id || 0,
      totalAmount: Number(transactionsCompleted._sum?.amount || 0),
      expectedCommission: Number(commissionData._sum?.commissionAmount || 0),
      liableCommission: Number(commissionData._sum?.commissionAmount || 0)
    },
    recentTransactions,
    monthlyPerformance,
    agentPerformance: processedAgentPerformance
  }
}
