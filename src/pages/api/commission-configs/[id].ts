import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Configuration ID is required' })
  }

  const configId = parseInt(id)

  try {
    if (req.method === 'DELETE') {
      // Check if configuration exists
      const config = await prisma.commissionConfig.findUnique({ where: { id: configId } })
      if (!config) {
        return res.status(404).json({ message: 'Commission configuration not found' })
      }

      // Delete in transaction
      await prisma.$transaction(async tx => {
        // Delete user assignments first
        await tx.commissionUserAssignment.deleteMany({
          where: { commissionConfigId: configId }
        })

        // Delete the configuration
        await tx.commissionConfig.delete({
          where: { id: configId }
        })
      })

      return res.status(200).json({
        success: true,
        message: 'Commission configuration deleted successfully'
      })
    } else if (req.method === 'GET') {
      // Get single configuration with assignments
      const config = await prisma.commissionConfig.findUnique({
        where: { id: configId },
        include: {
          commissionUserAssignments: {
            select: { userId: true }
          }
        }
      })

      if (!config) {
        return res.status(404).json({ message: 'Commission configuration not found' })
      }

      // Transform data
      const transformedConfig = {
        ...config,
        kpiWeights: config.kpiWeights ? JSON.parse(config.kpiWeights) : {},
        assignedUserIds: config.commissionUserAssignments.map(assignment => assignment.userId)
      }

      return res.status(200).json({
        success: true,
        data: transformedConfig
      })
    } else if (req.method === 'PUT') {
      // Update configuration
      const {
        title,
        code,
        description,
        type = 'percentage',
        value,
        agentType = 'all',
        status = 'active',
        minTransactionAmount = 100000,
        commissionRate = 0.05,
        paybandFee = 0,
        superAgentCommissionRate = 0.2,
        superAgentFixedRate = 0.3,
        superAgentVariableRate = 0.7,
        franchiseMultiplier = 4.5,
        kpiWeights = {
          activeness: 55,
          valueTransacted: 25,
          uniqueAgents: 20
        },
        assignedUsers = []
      } = req.body

      // Validate required fields
      if (!title || !code) {
        return res.status(400).json({
          message: 'Title and code are required',
          required: ['title', 'code']
        })
      }

      // Check if another configuration with the same code exists (excluding current one)
      const existingConfig = await prisma.commissionConfig.findFirst({
        where: {
          code,
          id: { not: configId }
        }
      })
      if (existingConfig) {
        return res.status(409).json({
          message: 'Commission configuration with this code already exists',
          code
        })
      }

      // Perform update in transaction
      await prisma.$transaction(async tx => {
        // Update configuration
        await tx.commissionConfig.update({
          where: { id: configId },
          data: {
            title,
            code,
            description: description || null,
            type,
            value,
            agentType,
            status,
            minTransactionAmount,
            commissionRate,
            paybandFee,
            superAgentCommissionRate,
            superAgentFixedRate,
            superAgentVariableRate,
            franchiseMultiplier,
            kpiWeights: JSON.stringify(kpiWeights),
            updatedAt: new Date().toISOString()
          }
        })

        // Delete existing user assignments
        await tx.commissionUserAssignment.deleteMany({
          where: { commissionConfigId: configId }
        })

        // If specific users are assigned, create new assignments
        if (assignedUsers && assignedUsers.length > 0) {
          await tx.commissionUserAssignment.createMany({
            data: assignedUsers.map((userId: number) => ({
              commissionConfigId: configId,
              userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
          })
        }
      })

      // Get the updated configuration with assignments
      const configWithAssignments = await prisma.commissionConfig.findUnique({
        where: { id: configId },
        include: {
          commissionUserAssignments: {
            select: { userId: true }
          }
        }
      })

      // Transform data
      const configWithUsers = {
        ...configWithAssignments,
        kpiWeights: configWithAssignments?.kpiWeights ? JSON.parse(configWithAssignments.kpiWeights) : {},
        assignedUserIds: configWithAssignments?.commissionUserAssignments.map(assignment => assignment.userId) || []
      }

      return res.status(200).json({
        success: true,
        message: 'Commission configuration updated successfully',
        data: configWithUsers
      })
    } else {
      return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Commission configuration API error:', error)

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
