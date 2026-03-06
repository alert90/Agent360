import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { search = '', type = '', sortBy = 'total_transactions', sortOrder = 'desc' } = req.query

      // Build where clause for agents
      const where: any = { isActive: 1 }

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { accountNumber: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      // Add type filter
      if (type) {
        where.type = type
      }

      // Get all agents
      const agents = await prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          accountNumber: true,
          type: true,
          branchName: true,
          isActive: true,
          totalTransactionAmount: true,
          transactionCount: true,
          commissionAmount: true,
          updatedAt: true
        }
      })

      // Get transaction totals grouped by agentId
      const transactionByAgentId = await prisma.transaction.groupBy({
        by: ['agentId'],
        where: {
          agentId: { in: agents.map(a => a.id) }
        },
        _sum: {
          amount: true,
          commissionAmount: true
        },
        _count: {
          id: true
        }
      })

      // Get transaction totals grouped by agentName (for matching by name/account number)
      const allTransactionAgentNames = await prisma.transaction.findMany({
        select: {
          agentName: true,
          amount: true,
          commissionAmount: true,
          timestamp: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Group by agentName
      const transactionByName: Record<
        string,
        { totalAmount: number; commissionAmount: number; count: number; lastTransaction: Date | null }
      > = {}

      allTransactionAgentNames.forEach(tx => {
        if (tx.agentName) {
          if (!transactionByName[tx.agentName]) {
            transactionByName[tx.agentName] = {
              totalAmount: 0,
              commissionAmount: 0,
              count: 0,
              lastTransaction: null
            }
          }
          transactionByName[tx.agentName].totalAmount += tx.amount || 0
          transactionByName[tx.agentName].commissionAmount += tx.commissionAmount || 0
          transactionByName[tx.agentName].count += 1
          const currentLast = transactionByName[tx.agentName].lastTransaction
          if (tx.timestamp && (!currentLast || tx.timestamp > currentLast)) {
            transactionByName[tx.agentName].lastTransaction = tx.timestamp
          }
        }
      })

      // Create a map for quick lookup by agentId
      const agentIdMap = new Map()
      transactionByAgentId.forEach(t => {
        agentIdMap.set(t.agentId, {
          totalAmount: t._sum.amount || 0,
          commissionAmount: t._sum.commissionAmount || 0,
          count: t._count.id
        })
      })

      // Calculate max transactions for performance score calculation
      let maxTransactions = 0
      let maxAmount = 0

      // Build agent performance data
      const agentPerformance = agents.map(agent => {
        // First try to get by agentId
        let txData = agentIdMap.get(agent.id)
        let lastTransaction: Date | null = null

        // If not found by ID, try by agent name
        if (!txData) {
          const nameData = transactionByName[agent.name]
          if (nameData) {
            txData = {
              totalAmount: nameData.totalAmount,
              commissionAmount: nameData.commissionAmount,
              count: nameData.count
            }
            lastTransaction = nameData.lastTransaction
          }
        }

        // If still not found, try by account number in agentName
        if (!txData) {
          const matchingEntry = Object.entries(transactionByName).find(
            ([key]) => agent.accountNumber && key.includes(agent.accountNumber)
          )
          if (matchingEntry) {
            txData = {
              totalAmount: matchingEntry[1].totalAmount,
              commissionAmount: matchingEntry[1].commissionAmount,
              count: matchingEntry[1].count
            }
            lastTransaction = matchingEntry[1].lastTransaction
          }
        }

        const totalTransactions = txData ? txData.count : agent.transactionCount || 0
        const totalAmount = txData ? txData.totalAmount : agent.totalTransactionAmount || 0
        const commissionAmount = txData ? txData.commissionAmount : agent.commissionAmount || 0

        // Track max for performance score
        if (totalTransactions > maxTransactions) maxTransactions = totalTransactions
        if (totalAmount > maxAmount) maxAmount = totalAmount

        return {
          id: agent.id.toString(),
          name: agent.name,
          account_number: agent.accountNumber,
          type: agent.type || 'local_agent',
          total_transactions: totalTransactions,
          total_amount: totalAmount,
          avg_transaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
          commission_amount: commissionAmount,
          performance_score: 0, // Will be calculated below
          last_transaction: lastTransaction
            ? new Date(lastTransaction).toLocaleDateString()
            : agent.updatedAt
            ? new Date(agent.updatedAt).toLocaleDateString()
            : 'N/A'
        }
      })

      // Calculate performance scores (based on transactions and amount)
      agentPerformance.forEach(agent => {
        const transactionScore = maxTransactions > 0 ? (agent.total_transactions / maxTransactions) * 50 : 0
        const amountScore = maxAmount > 0 ? (agent.total_amount / maxAmount) * 50 : 0
        agent.performance_score = Math.min(100, transactionScore + amountScore)
      })

      // Sort the results
      const sortedAgents = agentPerformance.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'total_amount':
            comparison = b.total_amount - a.total_amount
            break
          case 'total_transactions':
            comparison = b.total_transactions - a.total_transactions
            break
          case 'performance_score':
          default:
            comparison = b.performance_score - a.performance_score
        }

        return sortOrder === 'asc' ? -comparison : comparison
      })

      res.status(200).json({
        success: true,
        data: sortedAgents
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agent performance API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
