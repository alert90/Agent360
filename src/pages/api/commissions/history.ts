import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { period, agentType } = req.query

    const whereClause: any = {}

    if (period) {
      whereClause.period = period as string
    }

    if (agentType && agentType !== '') {
      whereClause.agentType = agentType as string
    }

    // Role-based filtering
    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent') {
      const agents = await prisma.agent.findMany({
        where: { parentAgentId: user.id },
        select: { id: true }
      })
      if (agents.length > 0) {
        whereClause.agentId = { in: agents.map(a => a.id) }
      }
    }

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: { period: 'desc', createdAt: 'desc' },
      include: {
        agent: true
      }
    })

    // Calculate summary
    const summary = {
      totalRecords: commissions.length,
      totalCommission: commissions.reduce((sum, c) => sum + (c.finalCommission || 0), 0),
      totalTransactions: commissions.reduce((sum, c) => sum + (c.transactionCount || 0), 0),
      avgCommission:
        commissions.length > 0
          ? commissions.reduce((sum, c) => sum + (c.finalCommission || 0), 0) / commissions.length
          : 0
    }

    // Format data for frontend
    const formattedData = commissions.map(c => ({
      id: c.id,
      agentId: c.agentId,
      agentName: c.agentName,
      agentType: c.agentType,
      accountNumber: c.agent?.accountNumber,
      period: c.period,
      totalAmount: c.totalAmount,
      transactionCount: c.transactionCount,
      eligibleAmount: c.eligibleAmount,
      commissionRate: c.commissionRate,
      commissionAmount: c.commissionAmount,
      payband: c.payband,
      finalCommission: c.finalCommission,
      createdAt: c.createdAt
    }))

    res.status(200).json({
      success: true,
      data: formattedData,
      summary
    })
  } catch (error) {
    console.error('Commission history API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
