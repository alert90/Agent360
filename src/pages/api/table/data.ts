import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { q = '', sort = 'desc', column = 'total_amount' } = req.query

      // Build where clause for search
      const where: any = { isActive: 1 }

      if (q) {
        where.OR = [
          { name: { contains: q as string, mode: 'insensitive' } },
          { accountNumber: { contains: q as string, mode: 'insensitive' } },
          { branchName: { contains: q as string, mode: 'insensitive' } }
        ]
      }

      // Validate sort column
      const validColumns = ['name', 'accountNumber', 'type', 'branchName', 'createdAt', 'transactionCount']
      const sortColumn = validColumns.includes(column as string)
        ? (column as keyof typeof where)
        : 'totalTransactionAmount'
      const sortOrder = sort === 'asc' ? 'asc' : 'desc'

      // Get transaction stats grouped by agentId and agentName for comprehensive matching
      const agentIdStats = await prisma.transaction.groupBy({
        by: ['agentId'],
        _sum: { amount: true, commissionAmount: true },
        _count: { id: true }
      })

      const agentNameStats = await prisma.transaction.groupBy({
        by: ['agentName'],
        _sum: { amount: true, commissionAmount: true },
        _count: { id: true },
        having: { agentName: { not: null } }
      })

      // Get agents
      const agents = await prisma.agent.findMany({
        where,
        orderBy: { [sortColumn]: sortOrder },
        include: {
          _count: {
            select: {
              transactions: true
            }
          }
        }
      })

      // Match stats to agents
      const agentData = agents.map(agent => {
        // Priority 1: agentId match
        let stat = agentIdStats.find(s => s.agentId === agent.id)

        // Priority 2: agentName match
        if (!stat) {
          stat = agentNameStats.find(s => s.agentName === agent.name)
        }

        // Priority 3: accountNumber in agentName
        if (!stat) {
          const nameStat = agentNameStats.find(
            s => s.agentName && agent.accountNumber && s.agentName.includes(agent.accountNumber)
          )
          if (nameStat) stat = nameStat
        }

        const transactions = stat ? stat._count.id : agent._count.transactions
        const totalAmount = stat ? stat._sum.amount || 0 : agent.totalTransactionAmount || 0
        const commissionAmount = stat ? stat._sum.commissionAmount || 0 : agent.commissionAmount || 0

        return {
          id: agent.id,
          name: agent.name,
          account_number: agent.accountNumber || 'N/A',
          type: agent.type || 'local_agent',
          transactions,
          totalAmount,
          commissionAmount,
          avatar: `/images/avatars/${(agent.id % 15) + 1}.png`
        }
      })

      res.status(200).json({
        success: true,
        data: agentData,
        total: agentData.length
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Table data API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
