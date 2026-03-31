import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { search = '', page = 1, limit = 25, sortBy = 'name', sortOrder = 'asc' } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    // Build where clause for unassigned local agents
    const whereClause: any = {
      type: 'local_agent',
      parentAgentId: null
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { accountNumber: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // Validate sort column
    const validSortColumns = ['name', 'accountNumber', 'type', 'createdAt', 'isActive']
    const finalSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'name'
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // Get unassigned agents with pagination
    const agents = await prisma.agent.findMany({
      where: whereClause,
      orderBy: { [finalSortBy as string]: finalSortOrder },
      skip: offset,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        accountNumber: true,
        type: true,
        isActive: true,
        parentAgentId: true,
        createdAt: true,
        email: true,
        phone: true,
        transactionCount: true,
        totalTransactionAmount: true
      }
    })

    // Get total count
    const total = await prisma.agent.count({ where: whereClause })

    // Transform to snake_case for frontend
    const transformedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      account_number: agent.accountNumber,
      type: agent.type,
      is_active: agent.isActive === 1,
      parent_agent_id: agent.parentAgentId,
      created_at: agent.createdAt?.toISOString(),
      email: agent.email,
      phone: agent.phone,
      transaction_count: agent.transactionCount || 0,
      total_transaction_amount: agent.totalTransactionAmount || 0
    }))

    res.status(200).json({
      success: true,
      data: transformedAgents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching unassigned agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
