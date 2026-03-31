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

    const { period } = req.query

    const whereClause: any = {}
    if (period) {
      whereClause.period = period as string
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
      orderBy: { period: 'desc' }
    })

    // Get unique periods
    const periods = [...new Set(commissions.map(c => c.period))].sort().reverse()

    res.status(200).json({
      success: true,
      data: commissions,
      periods
    })
  } catch (error) {
    console.error('Commission overview API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
