// src/pages/api/commissions/history.ts
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
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { period, agentType } = req.query
    const whereClause: any = {}

    if (period) whereClause.period = period as string
    if (agentType && agentType !== '') whereClause.agent_type = agentType as string

    // Role-based filtering
    if (user.role === 'agent') {
      whereClause.agent_id = user.id
    } else if (user.role === 'super_agent') {
      const agents = await prisma.agent.findMany({
        where: { parentAgentId: user.id },
        select: { id: true }
      })
      if (agents.length > 0) whereClause.agent_id = { in: agents.map(a => a.id) }
    }

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: [{ period: 'desc' }, { created_at: 'desc' }],
      include: { agents: true }
    })

    // snake_case field names from Prisma model
    const formattedData = commissions.map(c => ({
      id: c.id,
      agentId: c.agent_id,
      agentName: c.agent_name,
      agentType: c.agent_type,
      accountNumber: c.agents?.accountNumber || '',
      period: c.period,
      totalAmount: c.total_amount,
      transactionCount: c.transaction_count,
      eligibleAmount: c.eligible_amount,
      commissionRate: c.commission_rate,
      commissionAmount: c.commission_amount,
      payband: c.payband,
      finalCommission: c.final_commission,
      createdAt: c.created_at
    }))

    const summary = {
      totalRecords: formattedData.length,
      totalCommission: commissions.reduce((sum, c) => sum + (c.final_commission || 0), 0),
      totalTransactions: commissions.reduce((sum, c) => sum + (c.transaction_count || 0), 0),
      avgCommission:
        formattedData.length > 0
          ? commissions.reduce((sum, c) => sum + (c.final_commission || 0), 0) / formattedData.length
          : 0
    }

    res.status(200).json({ success: true, data: formattedData, summary })
  } catch (error) {
    console.error('Commission history API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
