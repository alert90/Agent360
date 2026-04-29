// src/pages/api/dashboard/super-agent.ts
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

    if (!user || user.role !== 'super_agent') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if user has a linked account number
    if (!user.accountNumber) {
      return res.status(400).json({ message: 'No account linked to this user' })
    }

    const superAgentData = await getSuperAgentData(user)

    res.status(200).json(superAgentData)
  } catch (error) {
    console.error('Super agent dashboard API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function getSuperAgentData(user: any) {
  // Find the agent by matching the user's accountNumber
  const superAgent = await prisma.agent.findFirst({
    where: {
      accountNumber: user.accountNumber,
      type: 'super_agent',
      isActive: 1
    }
  })

  if (!superAgent) {
    throw new Error(`Super Agent not found for account ${user.accountNumber}`)
  }

  const superAgentId = superAgent.id

  // Get child agents
  const childAgents = await prisma.agent.findMany({
    where: { parentAgentId: superAgentId, isActive: 1 },
    select: { id: true }
  })

  const childAgentIds = childAgents.map(a => a.id)
  const agentsServed = childAgents.length

  // Transaction data
  const transactionsCompleted = await prisma.transaction.aggregate({
    where: {
      agentId: { in: childAgentIds },
      status: 'completed'
    },
    _count: { id: true },
    _sum: { amount: true }
  })

  // Commission data
  const commissionData = await prisma.agent.aggregate({
    where: {
      parentAgentId: superAgentId,
      isActive: 1
    },
    _sum: { commissionAmount: true }
  })

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      agentId: { in: childAgentIds }
    },
    include: {
      agent: {
        select: { name: true, branchName: true }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 10
  })

  // Monthly performance
  const monthlyPerformance = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
      COUNT(*)::integer as "transactionCount",
      COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
      COALESCE(SUM(t."commission_amount"), 0)::numeric as "commissionEarned"
    FROM "transactions" t
    WHERE t."agent_id" IN (${Prisma.join(childAgentIds)})
      AND t.status = 'completed'
    GROUP BY DATE_TRUNC('month', t."timestamp")
    ORDER BY DATE_TRUNC('month', t."timestamp") DESC
    LIMIT 6
  `

  // Agent performance - top 10 agents
  const agentPerformance = await prisma.agent.findMany({
    where: {
      parentAgentId: superAgentId,
      type: 'local_agent',
      isActive: 1
    },
    orderBy: { totalTransactionAmount: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      accountNumber: true,
      branchName: true,
      transactionCount: true,
      totalTransactionAmount: true,
      commissionAmount: true
    }
  })

  const processedAgentPerformance = agentPerformance.map(agent => ({
    id: agent.id,
    name: agent.name,
    accountNumber: agent.accountNumber,
    branchName: agent.branchName,
    transactionCount: agent.transactionCount || 0,
    totalAmount: agent.totalTransactionAmount || 0,
    commissionEarned: agent.commissionAmount || 0
  }))

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
