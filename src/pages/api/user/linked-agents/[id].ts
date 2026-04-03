// pages/api/user/linked-agents/[id].ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const userId = decoded.id
    const { id } = req.query
    const agentId = parseInt(id as string)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedAgents: true }
    })

    const currentIds = (user?.linkedAgents as number[]) || []

    if (req.method === 'DELETE') {
      const newIds = currentIds.filter(id => id !== agentId)

      await prisma.user.update({
        where: { id: userId },
        data: { linkedAgents: newIds }
      })

      return res.status(200).json({ message: 'Agent unlinked successfully' })
    }

    if (req.method === 'PUT') {
      // Set as default - for JSON array, default is just the first one
      // Reorder so this agent is first
      const newIds = [agentId, ...currentIds.filter(id => id !== agentId)]

      await prisma.user.update({
        where: { id: userId },
        data: { linkedAgents: newIds }
      })

      return res.status(200).json({ message: 'Default agent updated' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)

    return res.status(500).json({ message: 'Internal server error' })
  }
}
