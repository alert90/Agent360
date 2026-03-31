import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const assignments = await prisma.agentAssignment.findMany({
      where: { status: 'active' },
      include: {
        localAgent: {
          select: { name: true, accountNumber: true }
        },
        superAgent: {
          select: { name: true, accountNumber: true }
        },
        franchise: {
          select: { name: true, accountNumber: true }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    // Transform to match frontend expectations
    const transformedAssignments = assignments.map(a => ({
      id: a.id,
      local_agent_id: a.localAgentId,
      local_agent_name: a.localAgent?.name,
      local_agent_account_number: a.localAgent?.accountNumber,
      super_agent_id: a.superAgentId,
      super_agent_name: a.superAgent?.name,
      super_agent_account_number: a.superAgent?.accountNumber,
      franchise_id: a.franchiseId,
      franchise_name: a.franchise?.name,
      franchise_account_number: a.franchise?.accountNumber,
      assigned_at: a.assignedAt,
      assigned_by: a.assignedBy,
      status: a.status
    }))

    res.status(200).json({
      success: true,
      data: transformedAssignments
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
