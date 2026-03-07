import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { search = '', page = 1, limit = 25, type = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      const offset = (Number(page) - 1) * Number(limit)

      // Build where clause
      const whereClause: any = {}

      // Add search filter
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { accountNumber: { contains: search as string, mode: 'insensitive' } },
          { branchName: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      // Add type filter
      if (type && type !== '') {
        whereClause.type = type
      }

      // Validate sort column
      const sortColumnMap: Record<string, string> = {
        name: 'name',
        account_number: 'accountNumber',
        type: 'type',
        branch_name: 'branchName',
        created_at: 'createdAt',
        transaction_count: 'transactionCount',
        total_transaction_amount: 'totalTransactionAmount',
        commission_amount: 'commissionAmount'
      }
      const prismaSortBy = sortColumnMap[sortBy as string] || 'createdAt'
      const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

      // Get agents with pagination using Prisma
      const agents = await prisma.agent.findMany({
        where: whereClause,
        orderBy: { [prismaSortBy]: finalSortOrder },
        skip: offset,
        take: Number(limit),
        select: {
          id: true,
          accountNumber: true,
          name: true,
          username: true,
          email: true,
          role: true,
          type: true,
          branchCode: true,
          branchName: true,
          zone: true,
          parentAgentId: true,
          isActive: true,
          commissionEligible: true,
          totalTransactionAmount: true,
          transactionCount: true,
          commissionAmount: true,
          payband: true,
          createdAt: true,
          updatedAt: true,
          phone: true,
          contact: true
        }
      })

      // Get total count for pagination
      const total = await prisma.agent.count({ where: whereClause })

      // Get unique types for filter
      const types = await prisma.agent.findMany({
        where: {
          type: { not: null, not: '' }
        },
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' }
      })

      // Get statistics
      const allAgentsCount = await prisma.agent.count()
      const superAgentCount = await prisma.agent.count({ where: { type: 'super_agent' } })
      const franchiseCount = await prisma.agent.count({ where: { type: 'franchise' } })
      const activeCount = await prisma.agent.count({ where: { isActive: 1 } })

      // Transform Prisma camelCase field names to snake_case for frontend compatibility
      const transformedAgents = agents.map(agent => ({
        id: agent.id,
        account_number: agent.accountNumber,
        name: agent.name,
        username: agent.username,
        email: agent.email,
        role: agent.role,
        type: agent.type || 'local_agent',
        branch_code: agent.branchCode,
        branch_name: agent.branchName,
        zone: agent.zone,
        parent_agent_id: agent.parentAgentId,
        is_active: agent.isActive === 1,
        commission_eligible: agent.commissionEligible === 1,
        total_transaction_amount: agent.totalTransactionAmount || 0,
        transaction_count: agent.transactionCount || 0,
        commission_amount: agent.commissionAmount || 0,
        payband: agent.payband || 1.0,
        created_at: agent.createdAt?.toISOString() || null,
        updated_at: agent.updatedAt?.toISOString() || null,
        phone: agent.phone,
        contact: agent.contact
      }))

      res.status(200).json({
        success: true,
        data: transformedAgents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        filters: {
          types: types.map(t => t.type).filter(Boolean)
        },
        stats: {
          totalAgents: allAgentsCount || 0,
          totalFranchise: franchiseCount || 0,
          totalSuperAgents: superAgentCount || 0,
          activeAgents: activeCount || 0
        }
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agents list API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
