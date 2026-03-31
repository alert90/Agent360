import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const parentAgentId = parseInt(id as string)

  if (req.method === 'POST') {
    const { target_agent_id, target_account_number } = req.body

    if (!target_agent_id || !target_account_number) {
      return res.status(400).json({
        success: false,
        message: 'Target agent ID and account number are required'
      })
    }

    try {
      const result = await prisma.$transaction(async tx => {
        // Fetch parent agent (super agent or franchise)
        const parentAgent = await tx.agent.findUnique({
          where: { id: parentAgentId }
        })

        if (!parentAgent) {
          throw new Error('Parent agent not found')
        }

        // Check if target agent exists by ID or account_number
        let targetAgent = await tx.agent.findUnique({
          where: { id: parseInt(target_agent_id) }
        })

        let targetAgentId = parseInt(target_agent_id)
        let wasCreated = false

        if (!targetAgent) {
          // Try by account number (for detected agents)
          targetAgent = await tx.agent.findUnique({
            where: { accountNumber: target_account_number }
          })

          if (targetAgent) {
            targetAgentId = targetAgent.id
          } else {
            // Create new agent with required fields
            targetAgent = await tx.agent.create({
              data: {
                accountNumber: target_account_number,
                name: `${target_account_number} (Auto-Created)`,
                type: 'local_agent',
                branchCode: parentAgent.branchCode || 'AUTO',
                branchName: parentAgent.branchName || 'Auto Created',
                isActive: 1,
                zone: parentAgent.zone || 'Unknown'
              }
            })
            targetAgentId = targetAgent.id
            wasCreated = true
            console.log(`Created new agent ${targetAgentId} for account ${target_account_number}`)
          }
        }

        // Check if target agent is already assigned to someone else
        if (targetAgent.parentAgentId && targetAgent.parentAgentId !== parentAgentId) {
          throw new Error(
            `Agent ${targetAgent.name} is already assigned to another ${
              parentAgent.type === 'super_agent' ? 'super agent' : 'franchise'
            }. Please unassign first.`
          )
        }

        // Update parent_agent_id (this is the only assignment needed)
        const updatedAgent = await tx.agent.update({
          where: { id: targetAgentId },
          data: {
            parentAgentId: parentAgentId,
            updatedAt: new Date()
          }
        })

        return { updatedAgent, agentCreated: wasCreated }
      })

      res.status(200).json({
        success: true,
        message: result.agentCreated ? 'New agent created and assigned successfully' : 'Agent assigned successfully',
        data: result
      })
    } catch (error) {
      console.error('Error assigning agent:', error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign agent'
      })
    }
  } else if (req.method === 'DELETE') {
    const { target_agent_id } = req.query

    if (!target_agent_id) {
      return res.status(400).json({
        success: false,
        message: 'Target agent ID is required'
      })
    }

    try {
      const targetAgentId = parseInt(target_agent_id as string)

      // Check if target agent exists and is assigned to this parent
      const targetAgent = await prisma.agent.findUnique({
        where: { id: targetAgentId }
      })

      if (!targetAgent) {
        return res.status(404).json({
          success: false,
          message: `Target agent ${target_agent_id} not found`
        })
      }

      if (targetAgent.parentAgentId !== parentAgentId) {
        return res.status(400).json({
          success: false,
          message: 'Agent is not assigned to this parent'
        })
      }

      // Remove parent_agent_id (unassign)
      const updatedAgent = await prisma.agent.update({
        where: { id: targetAgentId },
        data: {
          parentAgentId: null,
          updatedAt: new Date()
        }
      })

      res.status(200).json({
        success: true,
        message: 'Agent unassigned successfully',
        data: updatedAgent
      })
    } catch (error) {
      console.error('Error unassigning agent:', error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unassign agent'
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
