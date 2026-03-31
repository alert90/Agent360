import { prisma } from './db'

interface Commission {
  finalCommission: number | null
  totalAmount: number | null
  transactionCount: number | null
  agentType: string
}

export class DatabaseService {
  static async getAgentById(id: number) {
    return prisma.agent.findUnique({
      where: { id },
      include: {
        parentAgent: true,
        childAgents: true,
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    })
  }

  static async getAgentsByParent(parentId: number, type?: string) {
    return prisma.agent.findMany({
      where: {
        parentAgentId: parentId,
        ...(type && { type }),
        isActive: 1
      }
    })
  }

  static async getAgentWithPerformance(agentId: number, period: string) {
    const [agent, commission] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: agentId }
      }),
      prisma.commission.findUnique({
        where: {
          agentId_period: {
            agentId,
            period
          }
        }
      })
    ])

    return { agent, commission }
  }

  static async getTransactionsByAgent(agentId: number, limit = 100) {
    return prisma.transaction.findMany({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
  }

  static async getTransactionStats(where?: any) {
    return prisma.transaction.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true, commissionAmount: true },
      _avg: { amount: true }
    })
  }

  static async getCommissionForPeriod(period: string) {
    return prisma.commission.findMany({
      where: { period },
      include: {
        agent: true
      }
    })
  }

  static async getCommissionSummary(period: string) {
    const commissions = (await prisma.commission.findMany({
      where: { period }
    })) as Commission[]

    return {
      totalAgents: commissions.length,
      totalCommission: commissions.reduce((sum: number, c: Commission) => sum + (c.finalCommission || 0), 0),
      totalAmount: commissions.reduce((sum: number, c: Commission) => sum + (c.totalAmount || 0), 0),
      totalTransactions: commissions.reduce((sum: number, c: Commission) => sum + (c.transactionCount || 0), 0),
      byType: {
        super_agent: commissions.filter((c: Commission) => c.agentType === 'super_agent'),
        franchise: commissions.filter((c: Commission) => c.agentType === 'franchise'),
        local_agent: commissions.filter((c: Commission) => c.agentType === 'local_agent')
      }
    }
  }

  static async getActiveCommissionConfig() {
    return prisma.commissionConfig.findFirst({
      where: { isActive: 1 }
    })
  }

  static async getDashboardStats(userId: number, userRole: string) {
    const whereClause: any = {}

    if (userRole === 'agent') {
      whereClause.agentId = userId
    } else if (userRole === 'super_agent' || userRole === 'franchise') {
      const agents = await prisma.agent.findMany({
        where: { parentAgentId: userId, isActive: 1 },
        select: { id: true }
      })
      if (agents.length > 0) {
        whereClause.agentId = { in: agents.map((a: { id: number }) => a.id) }
      }
    }

    const [transactionStats, agentCounts] = await Promise.all([
      prisma.transaction.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { amount: true, commissionAmount: true }
      }),
      prisma.agent.count({
        where: userRole === 'admin' ? {} : { parentAgentId: userId, isActive: 1 }
      })
    ])

    return {
      totalTransactions: transactionStats._count.id || 0,
      totalAmount: Number(transactionStats._sum?.amount || 0),
      totalCommission: Number(transactionStats._sum?.commissionAmount || 0),
      totalAgents: agentCounts
    }
  }
}

export default DatabaseService
