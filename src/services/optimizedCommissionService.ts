import { prisma } from '../lib/prisma'

// Optimized commission calculation service using Prisma for better performance
export class OptimizedCommissionService {
  // Batch operations for better performance
  private static readonly BATCH_SIZE = 1000

  /**
   * Calculate commissions for multiple agents in parallel
   */
  static async calculateBatchCommissions(agentIds: number[], period: string) {
    const results = []

    // Process in batches to avoid memory issues
    for (let i = 0; i < agentIds.length; i += this.BATCH_SIZE) {
      const batch = agentIds.slice(i, i + this.BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(agentId => this.calculateAgentCommission(agentId, period)))
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Calculate commission for a single agent with optimized queries
   */
  static async calculateAgentCommission(agentId: number, period: string) {
    // Get agent data first
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    // Get transactions for this agent in the period
    const transactions = await prisma.transaction.findMany({
      where: {
        agentId,
        createdAt: {
          gte: new Date(period + '-01').toISOString(),
          lt: new Date(period + '-01').setMonth(new Date(period + '-01').getMonth() + 1).toISOString()
        }
      },
      select: {
        amount: true,
        commissionEligible: true,
        commissionAmount: true
      }
    })

    // Calculate totals using JavaScript for better performance
    const totalAmount = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
    const transactionCount = transactions.length
    const eligibleAmount = transactions
      .filter((tx: any) => tx.commissionEligible)
      .reduce((sum: number, tx: any) => sum + tx.amount, 0)

    // Get commission rate based on agent type
    const commissionRate = await this.getCommissionRate(agent.type)
    const commissionAmount = eligibleAmount * commissionRate
    const finalCommission = commissionAmount * (agent.payband || 1.0)

    // Store calculation using the commissions table
    const calculation = await prisma.commissions.create({
      data: {
        agent_id: agentId,
        agent_name: agent.name,
        agent_type: agent.type,
        period,
        transaction_count: transactionCount,
        total_amount: totalAmount,
        eligible_amount: eligibleAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        payband: agent.payband || 1.0,
        final_commission: finalCommission,
        status: 'calculated'
      }
    })

    return calculation
  }

  /**
   * Get commission rate based on agent type with caching
   */
  private static commissionRateCache = new Map<string, number>()

  static async getCommissionRate(agentType: string): Promise<number> {
    if (this.commissionRateCache.has(agentType)) {
      return this.commissionRateCache.get(agentType)!
    }

    const config = await prisma.commissionConfig.findFirst({
      where: {
        agentType,
        isActive: 1,
        status: 'active'
      }
    })

    const rate = config?.commissionRate || 0.05
    this.commissionRateCache.set(agentType, rate)

    return rate
  }

  /**
   * Calculate Super Agent KPIs with optimized queries
   */
  static async calculateSuperAgentKPIs(superAgentId: number, period: string) {
    // Get all local agents under this super agent
    const localAgents = await prisma.agentAssignment.findMany({
      where: { superAgentId }
    })

    const localAgentIds = localAgents.map(la => la.localAgentId)

    // Get transactions for all local agents
    const transactions = await prisma.transaction.findMany({
      where: {
        agentId: { in: localAgentIds },
        createdAt: {
          gte: new Date(period + '-01').toISOString(),
          lt: new Date(period + '-01').setMonth(new Date(period + '-01').getMonth() + 1).toISOString()
        }
      }
    })

    // Calculate KPIs
    const totalAgents = localAgents.length
    const activeAgentIds = new Set(transactions.map(tx => tx.agentId))
    const activeAgents = activeAgentIds.size
    const totalValue = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)

    // Calculate weighted scores (example weights)
    const activenessWeight = 0.3
    const valueTransactedWeight = 0.5
    const uniqueAgentsWeight = 0.2

    const activenessScore = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0
    const valueTransactedScore = Math.min((totalValue / 10000000) * 100, 100) // Cap at 100
    const uniqueAgentsScore = Math.min((totalAgents / 100) * 100, 100) // Cap at 100

    const totalScore =
      activenessScore * activenessWeight +
      valueTransactedScore * valueTransactedWeight +
      uniqueAgentsScore * uniqueAgentsWeight

    // Store KPIs
    const kpi = await prisma.superAgentKPI.create({
      data: {
        superAgentId,
        period,
        activenessWeight,
        valueTransactedWeight,
        uniqueAgentsWeight,
        activenessScore,
        valueTransactedScore,
        uniqueAgentsScore,
        totalScore
      }
    })

    return kpi
  }

  /**
   * Calculate franchise commissions with optimized queries
   */
  static async calculateFranchiseCommission(franchiseId: number, period: string) {
    // Get all agents under this franchise
    const agents = await prisma.agentAssignment.findMany({
      where: { franchiseId }
    })

    const agentIds = agents.map(a => a.localAgentId)

    // Get transactions for all agents
    const transactions = await prisma.transaction.findMany({
      where: {
        agentId: { in: agentIds },
        createdAt: {
          gte: new Date(period + '-01').toISOString(),
          lt: new Date(period + '-01').setMonth(new Date(period + '-01').getMonth() + 1).toISOString()
        }
      }
    })

    // Calculate totals
    const agentToCustomerValue = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)

    // Get expected turnover (could be from settings or previous period)
    const expectedTurnover = await this.getExpectedTurnover(franchiseId, period)
    const actualTurnover = agentToCustomerValue

    // Get franchise commission rate
    const franchiseData = await prisma.agent.findUnique({
      where: { id: franchiseId }
    })

    const commissionRate = await this.getCommissionRate(franchiseData?.type || 'franchise')
    const payband = franchiseData?.payband || 1.0
    const franchiseMultiplier = 4.5 // This could be from config

    const commissionAmount = actualTurnover * commissionRate * franchiseMultiplier
    const clawbackAmount = Math.max(0, expectedTurnover - actualTurnover) * 0.1 // 10% clawback
    const finalCommission = Math.max(0, commissionAmount - clawbackAmount)

    // Store calculation
    const calculation = await prisma.franchiseCalculation.create({
      data: {
        franchiseId,
        period,
        agentToCustomerValue,
        expectedTurnover,
        actualTurnover,
        payband,
        commissionRate,
        commissionAmount,
        clawbackAmount,
        finalCommission
      }
    })

    return calculation
  }

  /**
   * Get expected turnover for a franchise
   */
  private static async getExpectedTurnover(franchiseId: number, period: string): Promise<number> {
    // This could be based on historical data or fixed targets
    // For now, return a default value
    return 10000000 // 10M default
  }

  /**
   * Get commission report with optimized queries
   */
  static async getCommissionReport(period: string, agentType?: string) {
    const where: any = { period }
    if (agentType) {
      where.agent_type = agentType
    }

    const calculations = await prisma.commissions.findMany({
      where,
      orderBy: { final_commission: 'desc' }
    })

    // Calculate summary manually
    const summary = calculations.reduce(
      (acc: any, calc: any) => {
        acc.totalCommission += calc.final_commission || 0
        acc.totalAmount += calc.total_amount || 0
        acc.agentCount += 1

        return acc
      },
      { totalCommission: 0, totalAmount: 0, agentCount: 0 }
    )

    return {
      calculations,
      summary: {
        totalCommission: summary.totalCommission,
        totalAmount: summary.totalAmount,
        agentCount: summary.agentCount,
        averageCommission: summary.agentCount ? summary.totalCommission / summary.agentCount : 0
      }
    }
  }

  /**
   * Bulk insert transactions for better performance
   */
  static async bulkInsertTransactions(transactions: any[]) {
    const chunks = []
    for (let i = 0; i < transactions.length; i += this.BATCH_SIZE) {
      chunks.push(transactions.slice(i, i + this.BATCH_SIZE))
    }

    const results = []
    for (const chunk of chunks) {
      const result = await prisma.transaction.createMany({
        data: chunk,
        skipDuplicates: true
      })
      results.push(result)
    }

    return results
  }

  /**
   * Clear cache when needed
   */
  static clearCache() {
    this.commissionRateCache.clear()
  }
}

export default OptimizedCommissionService
