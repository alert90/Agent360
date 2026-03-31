import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { local_agent_id, super_agent_id, franchise_id, status } = req.body

  if (!local_agent_id) {
    return res.status(400).json({ message: 'Local agent ID is required' })
  }

  if (!super_agent_id && !franchise_id) {
    return res.status(400).json({ message: 'Either super agent ID or franchise ID is required' })
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // Create assignment record
      const assignment = await tx.agentAssignment.create({
        data: {
          localAgentId: parseInt(local_agent_id),
          superAgentId: super_agent_id ? parseInt(super_agent_id) : null,
          franchiseId: franchise_id ? parseInt(franchise_id) : null,
          status: status || 'active',
          assignedBy: 'admin',
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })

      // Update agent's parent_agent_id
      const updatedAgent = await tx.agent.update({
        where: { id: parseInt(local_agent_id) },
        data: {
          parentAgentId: super_agent_id ? parseInt(super_agent_id) : franchise_id ? parseInt(franchise_id) : null,
          updatedAt: new Date()
        }
      })

      return { assignment, updatedAgent }
    })

    res.status(200).json({
      success: true,
      message: 'Agent assigned successfully',
      data: { id: result.assignment.id }
    })
  } catch (error) {
    console.error('Error assigning agent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
