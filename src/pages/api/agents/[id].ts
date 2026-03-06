import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  const agentId = parseInt(id as string)

  try {
    if (req.method === 'GET') {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      })

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      res.status(200).json({
        success: true,
        data: agent
      })
    } else if (req.method === 'PUT') {
      const { name, accountNumber, type, isActive, email, phone, contact, branchCode, branchName, region, zone } =
        req.body

      console.log('Agent update request:', { id, name, accountNumber, type, isActive })

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Agent name is required and cannot be empty'
        })
      }

      if (!accountNumber || accountNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Account number is required and cannot be empty'
        })
      }

      // Validate type if provided
      if (type && type.trim() !== '' && !['local_agent', 'super_agent', 'franchise'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid agent type: "${type}". Must be local_agent, super_agent, or franchise`
        })
      }

      // Check if agent exists
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId }
      })

      if (!existingAgent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      // Update agent
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          name,
          accountNumber,
          type,
          isActive: isActive ? 1 : 0,
          email,
          phone,
          contact,
          branchCode,
          branchName,
          region,
          zone,
          updatedAt: new Date()
        }
      })

      // Auto-populate branch data if missing
      if (!branchCode || !branchName) {
        const branchData = await prisma.transaction.findFirst({
          where: { agentId: agentId },
          orderBy: { createdAt: 'desc' },
          select: { location: true }
        })

        if (branchData && branchData.location) {
          await prisma.agent.update({
            where: { id: agentId },
            data: {
              branchCode: branchCode || existingAgent.branchCode,
              branchName: branchName || branchData.location,
              updatedAt: new Date()
            }
          })
          console.log(`Auto-populated branch data for agent ${id}`)
        }
      }

      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent
      })
    }
  } catch (error) {
    console.error('Error in agent API:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
