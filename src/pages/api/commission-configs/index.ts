import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
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

    // Check if code already exists
    const existingConfig = await prisma.commissionConfig.findUnique({
      where: { code }
    })

    if (existingConfig) {
      return res.status(409).json({
        message: 'Commission configuration with this code already exists',
        code
      })
    }

    // Create new commission configuration
    const newConfig = await prisma.commissionConfig.create({
      data: {
        title,
        code,
        description,
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
        isActive: 1
      }
    })

    // If specific users are assigned, create user assignments
    if (assignedUsers && assignedUsers.length > 0) {
      await prisma.commissionUserAssignment.createMany({
        data: assignedUsers.map((userId: number) => ({
          commissionConfigId: newConfig.id,
          userId
        }))
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Commission configuration saved successfully',
      configId: newConfig.id
    })
  } catch (error) {
    console.error('Failed to save commission configuration:', error)

    return res.status(500).json({
      message: 'Failed to save commission configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
