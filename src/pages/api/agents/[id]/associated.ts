import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const agentId = parseInt(id as string)

    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    // Only super_agent and franchise can have associated agents
    if (agent.type !== 'super_agent' && agent.type !== 'franchise') {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Local agents cannot have associated agents'
      })
    }

    // Get all child agents
    const childAgents = await prisma.agent.findMany({
      where: { parentAgentId: agentId, isActive: 1 },
      select: {
        id: true,
        name: true,
        accountNumber: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    })

    // Get transaction counts for each child agent
    const associatedAgentsWithStats = await Promise.all(
      childAgents.map(async child => {
        const stats = await prisma.transaction.aggregate({
          where: {
            agentId: child.id,
            status: 'completed'
          },
          _count: { id: true },
          _sum: { amount: true }
        })

        return {
          id: child.id,
          name: child.name,
          account_number: child.accountNumber,
          type: child.type,
          is_active: child.isActive === 1,
          assigned_at: child.createdAt?.toISOString() || new Date().toISOString(),
          total_transactions: stats._count.id || 0,
          total_amount: stats._sum.amount || 0
        }
      })
    )

    // Sort by total transactions descending
    associatedAgentsWithStats.sort((a, b) => b.total_transactions - a.total_transactions)

    res.status(200).json({
      success: true,
      data: associatedAgentsWithStats
    })
  } catch (error) {
    console.error('Error fetching associated agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch associated agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
