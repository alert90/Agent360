import { prisma } from '../../lib/db'

export class SuperAgentCommission {
  async calculate(agentId: number, period: string, config: any) {
    // Get all local agents under this super agent
    const localAgents = await prisma.agent.findMany({
      where: {
        parentAgentId: agentId,
        type: 'local_agent',
        isActive: 1
      },
      select: { id: true, name: true }
    })

    if (localAgents.length === 0) return null

    // Parse KPI weights from config
    const kpiWeights = config.kpiWeights
      ? JSON.parse(config.kpiWeights)
      : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

    // Get all transactions for these agents in the period
    const transactions = await prisma.transaction.groupBy({
      by: ['agentId'],
      where: {
        agentId: { in: localAgents.map(a => a.id) },
        timestamp: {
          gte: new Date(`${period}-01`),
          lt: new Date(new Date(`${period}-01`).getFullYear(), new Date(`${period}-01`).getMonth() + 1, 1)
        },
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    // Calculate eligible agents (those meeting threshold)
    const eligibleAgents = transactions.filter(t => (t._sum.amount || 0) >= (config.minTransactionAmount || 100000))
    const totalEligibleCommission =
      eligibleAgents.reduce((sum, t) => sum + (t._sum.amount || 0), 0) * (config.commissionRate || 0.05)

    // Super agent gets configured percentage of eligible commissions
    const totalEligibleSA = totalEligibleCommission * (config.superAgentCommissionRate || 0.2)

    // Fixed portion
    const fixedCommission = totalEligibleSA * (config.superAgentFixedRate || 0.3)

    // Calculate KPI Score
    const activeAgents = transactions.filter(t => t._count.id > 0).length
    const activenessScore = localAgents.length > 0 ? (activeAgents / localAgents.length) * 100 : 0

    const totalAmount = transactions.reduce((sum, t) => sum + (t._sum.amount || 0), 0)
    const expectedAmount = localAgents.length * (config.minTransactionAmount || 100000)
    const valueScore = expectedAmount > 0 ? Math.min((totalAmount / expectedAmount) * 100, 100) : 0

    const uniqueAgents = transactions.length
    const uniqueScore = localAgents.length > 0 ? (uniqueAgents / localAgents.length) * 100 : 0

    const kpiScore =
      (activenessScore * kpiWeights.activeness) / 100 +
      (valueScore * kpiWeights.valueTransacted) / 100 +
      (uniqueScore * kpiWeights.uniqueAgents) / 100

    // Determine KPI band
    let kpiBand = 0
    if (kpiScore >= 91) kpiBand = 100
    else if (kpiScore >= 81) kpiBand = 80
    else if (kpiScore >= 71) kpiBand = 60
    else if (kpiScore >= 61) kpiBand = 40
    else if (kpiScore >= 51) kpiBand = 20
    else kpiBand = 0

    // Variable portion with KPI band
    const variableCommission = totalEligibleSA * (config.superAgentVariableRate || 0.7) * (kpiBand / 100)

    const finalCommission = fixedCommission + variableCommission

    return {
      agentId,
      agentName: (await prisma.agent.findUnique({ where: { id: agentId } }))?.name || '',
      agentType: 'super_agent',
      period,
      totalAmount,
      transactionCount: transactions.reduce((sum, t) => sum + t._count.id, 0),
      eligibleAmount: totalEligibleSA,
      commissionRate: config.superAgentCommissionRate || 0.2,
      commissionAmount: totalEligibleSA,
      payband: kpiBand / 100,
      finalCommission,
      kpiDetails: {
        activeness: activenessScore,
        valueTransacted: valueScore,
        uniqueAgents: uniqueScore,
        total: kpiScore,
        band: kpiBand
      }
    }
  }
}
