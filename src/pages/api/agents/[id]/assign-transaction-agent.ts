import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const agentId = parseInt(id as string)

  if (req.method === 'POST') {
    // Assign an agent
    const { target_agent_id, target_account_number } = req.body

    if (!target_agent_id || !target_account_number) {
      return res.status(400).json({
        success: false,
        message: 'Target agent ID and account number are required'
      })
    }

    try {
      // Check if the target agent exists
      const targetAgent = await prisma.agent.findUnique({
        where: { id: parseInt(target_agent_id) }
      })

      if (!targetAgent) {
        return res.status(404).json({
          success: false,
          message: 'Target agent not found'
        })
      }

      // Start a transaction
      const result = await prisma.$transaction(async tx => {
        // Update the agent's parentAgentId
        const updatedAgent = await tx.agent.update({
          where: { id: parseInt(target_agent_id) },
          data: {
            parentAgentId: agentId,
            updatedAt: new Date()
          }
        })

        // Create or update assignment record
        const assignment = await tx.agentAssignment.upsert({
          where: {
            // You might need a composite unique constraint or use findFirst
            local_agent_id_super_agent_id_franchise_id: {
              localAgentId: parseInt(target_agent_id),
              superAgentId: agentId,
              franchiseId: null
            }
          },
          update: {
            status: 'active',
            updatedAt: new Date().toISOString()
          },
          create: {
            localAgentId: parseInt(target_agent_id),
            superAgentId: agentId,
            franchiseId: null,
            status: 'active',
            assignedBy: 'admin',
            assignedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })

        return { updatedAgent, assignment }
      })

      res.status(200).json({
        success: true,
        message: 'Agent assigned successfully',
        data: result
      })
    } catch (error) {
      console.error('Error assigning agent:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to assign agent',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else if (req.method === 'DELETE') {
    // Unassign an agent
    const { target_agent_id, target_account_number } = req.query

    if (!target_agent_id) {
      return res.status(400).json({
        success: false,
        message: 'Target agent ID is required'
      })
    }

    try {
      // Start a transaction
      const result = await prisma.$transaction(async tx => {
        // Update the agent's parentAgentId to NULL
        const updatedAgent = await tx.agent.update({
          where: { id: parseInt(target_agent_id as string) },
          data: {
            parentAgentId: null,
            updatedAt: new Date()
          }
        })

        // Find and update the assignment
        const assignment = await tx.agentAssignment.findFirst({
          where: {
            localAgentId: parseInt(target_agent_id as string),
            OR: [{ superAgentId: agentId }, { franchiseId: agentId }],
            status: 'active'
          }
        })

        if (assignment) {
          await tx.agentAssignment.update({
            where: { id: assignment.id },
            data: {
              status: 'inactive',
              updatedAt: new Date().toISOString()
            }
          })
        }

        return updatedAgent
      })

      res.status(200).json({
        success: true,
        message: 'Agent unassigned successfully',
        data: result
      })
    } catch (error) {
      console.error('Error unassigning agent:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to unassign agent',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
