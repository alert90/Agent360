// src/pages/api/commissions/config/[id].ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

// src/pages/api/commissions/config/[id].ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const numId = Number(id)

  if (isNaN(numId)) return res.status(400).json({ message: 'Invalid ID' })

  if (req.method === 'GET') {
    try {
      const config = await prisma.commissionConfig.findUnique({
        where: { id: numId },
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

      if (!config) {
        return res.status(404).json({ message: 'Configuration not found' })
      }

      res.json(config)
    } catch (error) {
      console.error('GET error:', error)
      res.status(500).json({ message: 'Failed to fetch configuration' })
    }
  } else if (req.method === 'PUT') {
    try {
      const data = req.body

      // Create a clean update object
      const updateData: any = {}

      // Only include fields that exist in the database
      const allowedFields = [
        'title',
        'code',
        'description',
        'type',
        'value',
        'agentType',
        'status',
        'minTransactionAmount',
        'commissionRate',
        'superAgentCommissionRate',
        'superAgentFixedRate',
        'superAgentVariableRate',
        'franchiseMultiplier',
        'franchiseBaseRate',
        'kpiWeights',
        'paybandRates',
        'startDate',
        'endDate',
        'isActive'
      ]

      // Copy only allowed fields
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          if ((field === 'startDate' || field === 'endDate') && data[field]) {
            // Convert date strings to Date objects
            const dateValue = new Date(data[field])
            if (!isNaN(dateValue.getTime())) {
              updateData[field] = dateValue
            } else {
              updateData[field] = null
            }
          } else {
            updateData[field] = data[field]
          }
        }
      }

      const config = await prisma.commissionConfig.update({
        where: { id: numId },
        data: updateData
      })

      // Handle assigned users separately
      const assignedUsers = data.assignedUsers
      if (assignedUsers !== undefined) {
        // Delete existing assignments
        await prisma.commissionUserAssignment.deleteMany({
          where: { commissionConfigId: numId }
        })

        // Create new assignments
        if (assignedUsers && assignedUsers.length > 0) {
          await prisma.commissionUserAssignment.createMany({
            data: assignedUsers.map((userId: number) => ({
              commissionConfigId: numId,
              userId
            }))
          })
        }
      }

      res.json(config)
    } catch (error) {
      console.error('PUT error:', error)
      res.status(500).json({
        message: 'Failed to update configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.commissionConfig.delete({ where: { id: numId } })
      res.json({ success: true })
    } catch (error) {
      console.error('DELETE error:', error)
      res.status(500).json({ message: 'Failed to delete configuration' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
