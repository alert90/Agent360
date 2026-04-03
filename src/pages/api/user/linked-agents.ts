// pages/api/user/linked-agents.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const userId = decoded.id

    // Get user with linked agents
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedAgents: true }
    })

    const linkedAgentIds = (user?.linkedAgents as number[]) || []

    if (req.method === 'GET') {
      // Get full agent details for linked IDs
      const agents = await prisma.agent.findMany({
        where: { id: { in: linkedAgentIds } },
        select: {
          id: true,
          accountNumber: true,
          name: true,
          branchName: true,
          type: true,
          isActive: true
        }
      })

      return res.status(200).json({ agents })
    }

    if (req.method === 'POST') {
      const { agentId } = req.body
      if (!agentId) return res.status(400).json({ message: 'Agent ID required' })

      const newLinkedIds = [...linkedAgentIds, agentId]
      await prisma.user.update({
        where: { id: userId },
        data: { linkedAgents: newLinkedIds }
      })

      return res.status(200).json({ message: 'Agent linked successfully' })
    }

    if (req.method === 'DELETE') {
      const { agentId } = req.query
      const newLinkedIds = linkedAgentIds.filter(id => id !== parseInt(agentId as string))
      await prisma.user.update({
        where: { id: userId },
        data: { linkedAgents: newLinkedIds }
      })

      return res.status(200).json({ message: 'Agent unlinked successfully' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)

    return res.status(500).json({ message: 'Internal server error' })
  }
}
