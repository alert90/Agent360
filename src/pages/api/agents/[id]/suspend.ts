import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // Verify JWT token
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

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const agentId = parseInt(id)
    const { reason } = req.body

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Suspension reason is required' })
    }

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    // Apply role-based access control for suspension
    if (user.role !== 'admin' && user.role !== 'analyst') {
      return res.status(403).json({ message: 'Access denied. Only admin and analyst can suspend agents.' })
    }

    // Create suspension record
    const suspension = await prisma.agentSuspension.create({
      data: {
        agentId,
        suspendedByUserId: user.id,
        reason,
        status: 'pending',
        createdAt: new Date()
      }
    })

    res.status(200).json({
      success: true,
      message: 'Agent suspension request submitted successfully. Awaiting analyst approval.',
      data: {
        suspension_id: suspension.id,
        agent_id: agentId,
        status: 'pending',
        reason,
        created_at: suspension.createdAt
      }
    })
  } catch (error) {
    console.error('Agent suspend API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process suspension request',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
