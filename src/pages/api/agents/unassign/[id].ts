import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Assignment ID is required' })
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // Get the assignment
      const assignment = await tx.agentAssignment.findUnique({
        where: { id: parseInt(id as string) }
      })

      if (!assignment) {
        throw new Error('Assignment not found')
      }

      // Update assignment status to inactive
      const updatedAssignment = await tx.agentAssignment.update({
        where: { id: parseInt(id as string) },
        data: {
          status: 'inactive',
          updatedAt: new Date().toISOString()
        }
      })

      // Remove parent_agent_id from the agent
      const updatedAgent = await tx.agent.update({
        where: { id: assignment.localAgentId },
        data: {
          parentAgentId: null,
          updatedAt: new Date()
        }
      })

      return { updatedAssignment, updatedAgent }
    })

    res.status(200).json({
      success: true,
      message: 'Agent unassigned successfully',
      data: result
    })
  } catch (error) {
    console.error('Error occur when unassign agent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unassign agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
