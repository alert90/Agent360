import { prisma } from '../../lib/db'

export class FranchiseCommission {
  async calculate(agentId: number, period: string, config: any, capitalAdvanced = 1000000) {
    // Get all agents under this franchise
    const franchiseAgents = await prisma.agent.findMany({
      where: {
        parentAgentId: agentId,
        isActive: 1
      },
      select: { id: true }
    })

    if (franchiseAgents.length === 0) return null

    // Get total transactions
    const transactions = await prisma.transaction.aggregate({
      where: {
        agentId: { in: franchiseAgents.map(a => a.id) },
        timestamp: {
          gte: new Date(`${period}-01`),
          lt: new Date(new Date(`${period}-01`).getFullYear(), new Date(`${period}-01`).getMonth() + 1, 1)
        },
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    const actualTurnover = transactions._sum.amount || 0
    const multiplier = config.franchiseMultiplier || 4.5
    const expectedTurnover = capitalAdvanced * multiplier
    const performance = (actualTurnover / expectedTurnover) * 100

    // Determine apportion rate based on performance
    let apportionRate = 0.2
    if (performance >= 100) apportionRate = 1.0
    else if (performance >= 80) apportionRate = 0.8
    else if (performance >= 60) apportionRate = 0.6
    else if (performance >= 40) apportionRate = 0.4

    const baseRate = config.franchiseBaseRate || config.commissionRate || 0.0005
    const baseCommission = capitalAdvanced * baseRate
    const finalCommission = baseCommission * apportionRate
    const clawback = baseCommission - finalCommission

    return {
      agentId,
      agentName: (await prisma.agent.findUnique({ where: { id: agentId } }))?.name,
      agentType: 'franchise',
      period,
      totalAmount: actualTurnover,
      transactionCount: transactions._count.id || 0,
      eligibleAmount: actualTurnover,
      commissionRate: baseRate,
      commissionAmount: baseCommission,
      payband: apportionRate,
      finalCommission,
      clawback,
      performance: {
        capitalAdvanced,
        expectedTurnover,
        actualTurnover,
        performancePct: performance,
        apportionRate
      }
    }
  }
}
