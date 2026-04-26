// src/pages/api/commissions/config/index.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const configs = await prisma.commissionConfig.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          commissionUserAssignments: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      })
      res.json(configs)
    } catch (error) {
      console.error('GET error:', error)
      res.status(500).json({ message: 'Failed to fetch configurations' })
    }
  } else if (req.method === 'POST') {
    try {
      const data = req.body

      // Clean up data
      const configData: any = {
        title: data.title,
        code: data.code,
        description: data.description,
        type: data.type || 'SUPER_AGENT',
        value: data.commissionRate || 0.05,
        agentType: data.type || 'all',
        status: data.status || 'active',
        minTransactionAmount: data.minTransactionAmount || 100000,
        commissionRate: data.commissionRate || 0.05,
        isActive: data.status === 'active' ? 1 : 0
      }

      // Convert dates
      if (data.startDate) {
        configData.startDate = new Date(data.startDate)
      }
      if (data.endDate) {
        configData.endDate = new Date(data.endDate)
      }

      // Type-specific fields
      if (data.type === 'SUPER_AGENT') {
        configData.superAgentCommissionRate = data.superAgentCommissionRate || 0.2
        configData.superAgentFixedRate = data.superAgentFixedRate || 0.3
        configData.superAgentVariableRate = data.superAgentVariableRate || 0.7
        configData.kpiWeights = JSON.stringify(
          data.kpiWeights || {
            activeness: 55,
            valueTransacted: 20,
            uniqueAgents: 25
          }
        )
        configData.franchiseMultiplier = null
        configData.franchiseBaseRate = null
        configData.paybandRates = JSON.stringify(
          data.kpiBands || [
            { min: 0, max: 50, rate: 0 },
            { min: 51, max: 60, rate: 20 },
            { min: 61, max: 70, rate: 40 },
            { min: 71, max: 80, rate: 60 },
            { min: 81, max: 90, rate: 80 },
            { min: 91, max: 100, rate: 100 }
          ]
        )
      } else {
        configData.franchiseMultiplier = data.franchiseMultiplier || 4.5
        configData.franchiseBaseRate = data.franchiseBaseRate || 0.0005
        configData.superAgentCommissionRate = null
        configData.superAgentFixedRate = null
        configData.superAgentVariableRate = null
        configData.kpiWeights = null
        configData.paybandRates = JSON.stringify(
          data.paybands || [
            { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
            { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
            { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
            { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
            { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
          ]
        )
      }

      // Remove undefined values
      Object.keys(configData).forEach(key => {
        if (configData[key] === undefined) {
          delete configData[key]
        }
      })

      const config = await prisma.commissionConfig.create({ data: configData })

      // Create user assignments if provided
      const assignedUsers = data.assignedUsers || []
      if (assignedUsers.length > 0) {
        await prisma.commissionUserAssignment.createMany({
          data: assignedUsers.map((userId: number) => ({
            commissionConfigId: config.id,
            userId
          }))
        })
      }

      res.status(201).json(config)
    } catch (error) {
      console.error('POST error:', error)
      res.status(500).json({
        message: 'Failed to create configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
