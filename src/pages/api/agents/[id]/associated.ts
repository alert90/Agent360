import type { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'
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

    // Verify token (we need the decoded value for future use but suppress warning)
    jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!)

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const agentId = parseInt(id)

    const associatedAgents = await prisma.agent.findMany({
      where: { parentAgentId: agentId },
      select: {
        id: true,
        name: true,
        accountNumber: true,
        type: true,
        isActive: true,
        transactionCount: true,
        totalTransactionAmount: true,
        createdAt: true
      },
      orderBy: { totalTransactionAmount: 'desc' }
    })

    const formattedAgents = associatedAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      account_number: agent.accountNumber,
      type: agent.type,
      is_active: agent.isActive === 1,
      assigned_at: agent.createdAt?.toISOString(),
      total_transactions: agent.transactionCount || 0,
      total_amount: agent.totalTransactionAmount || 0
    }))

    return res.status(200).json({
      success: true,
      data: formattedAgents
    })
  } catch (error) {
    console.error('Error fetching associated agents:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch associated agents'
    })
  }
}
