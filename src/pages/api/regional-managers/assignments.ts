import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const assignments = await prisma.regionalManagerAssignment.findMany({
        include: {
          regionalManager: {
            select: {
              id: true,
              fullName: true,
              email: true,
              zone: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              zone: true
            }
          }
        },
        where: {
          status: 'active'
        }
      })

      res.status(200).json(assignments)
    } catch (error) {
      console.error('Error fetching regional manager assignments:', error)
      res.status(500).json({ error: 'Failed to fetch assignments' })
    }
  } else if (req.method === 'POST') {
    try {
      const { regionalManagerId, agentId, assignedBy } = req.body

      // Check if assignment already exists
      const existing = await prisma.regionalManagerAssignment.findFirst({
        where: {
          regionalManagerId: parseInt(regionalManagerId),
          agentId: parseInt(agentId),
          status: 'active'
        }
      })

      if (existing) {
        return res.status(400).json({ error: 'Assignment already exists' })
      }

      const assignment = await prisma.regionalManagerAssignment.create({
        data: {
          regionalManagerId: parseInt(regionalManagerId),
          agentId: parseInt(agentId),
          assignedBy: assignedBy || 'admin'
        },
        include: {
          regionalManager: {
            select: {
              id: true,
              fullName: true,
              email: true,
              zone: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              zone: true
            }
          }
        }
      })

      res.status(201).json(assignment)
    } catch (error) {
      console.error('Error creating regional manager assignment:', error)
      res.status(500).json({ error: 'Failed to create assignment' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}