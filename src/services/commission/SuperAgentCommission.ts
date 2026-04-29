// src/services/commission/SuperAgentCommission.ts
import { prisma } from '../../lib/db'

interface SuperAgentResult {
  agentId: number
  agentName: string
  agentType: string
  period: string
  totalAmount: number
  transactionCount: number
  eligibleAmount: number
  commissionRate: number
  commissionAmount: number
  payband: number
  finalCommission: number
  kpiDetails: {
    totalAgents: number
    activeAgents: number
    activenessScore: number
    valueTransactedScore: number
    uniqueAgentsScore: number
    totalScore: number
    kpiBand: number
    fixedCommission: number
    variableCommission: number
  }
}

export class SuperAgentCommission {
  async calculate(superAgentId: number, period: string, config: any): Promise<SuperAgentResult | null> {
    try {
      const [year, month] = period.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

      const superAgent = await prisma.agent.findUnique({
        where: { id: superAgentId },
        select: { id: true, name: true, type: true, accountNumber: true }
      })

      if (!superAgent) {
        console.log(`Super Agent ${superAgentId} not found`)

        return null
      }

      console.log(`Processing Super Agent: ${superAgent.name}`)

      // Same query as transaction-agents API - detect agents via transactions
      const detectedAgents = await prisma.$queryRaw<any[]>`
        SELECT
          t."customer_account" as account_number,
          COUNT(*)::integer as transaction_count,
          SUM(t.amount) as total_amount
        FROM "transactions" t
        WHERE t."agent_id" = ${superAgentId}
          AND t."type" IN ('deposit', 'transfer')
          AND t."customer_account" IS NOT NULL
          AND t."customer_account" LIKE '01J7%'
          AND t."customer_account" != ${superAgent.accountNumber}
          AND t."timestamp" >= ${startDate}
          AND t."timestamp" <= ${endDate}
          AND t."status" = 'completed'
        GROUP BY t."customer_account"
        HAVING COUNT(*) >= 1
        ORDER BY transaction_count DESC, total_amount DESC
      `

      if (detectedAgents.length === 0) {
        console.log(`No transaction-detected agents for Super Agent ${superAgentId}`)

        return null
      }

      const totalAgents = detectedAgents.length
      const minThreshold = config.minTransactionAmount || 100000
      const eligibleAgents = detectedAgents.filter((a: any) => Number(a.total_amount) >= minThreshold)

      const activeAgents = eligibleAgents.length
      const totalTransactionValue = eligibleAgents.reduce((sum: number, a: any) => sum + Number(a.total_amount), 0)
      const uniqueAgentsCount = new Set(eligibleAgents.map((a: any) => a.account_number)).size
      const totalTransactionCount = eligibleAgents.reduce((sum: number, a: any) => sum + a.transaction_count, 0)

      console.log(`Detected: ${totalAgents}, Eligible: ${activeAgents}`)
      console.log(`Total value: ${totalTransactionValue}, Unique: ${uniqueAgentsCount}`)

      // KPI Weights
      const kpiWeights = config.kpiWeights
        ? typeof config.kpiWeights === 'string'
          ? JSON.parse(config.kpiWeights)
          : config.kpiWeights
        : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

      const activenessScore = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0
      const monthlyTarget = 100000000
      const valueTransactedScore = monthlyTarget > 0 ? Math.min((totalTransactionValue / monthlyTarget) * 100, 100) : 0
      const uniqueAgentsScore = totalAgents > 0 ? (uniqueAgentsCount / totalAgents) * 100 : 0

      const totalScore =
        (activenessScore * kpiWeights.activeness) / 100 +
        (valueTransactedScore * kpiWeights.valueTransacted) / 100 +
        (uniqueAgentsScore * kpiWeights.uniqueAgents) / 100

      // KPI Bands
      const kpiBands = config.paybandRates
        ? typeof config.paybandRates === 'string'
          ? JSON.parse(config.paybandRates)
          : config.paybandRates
        : [
            { min: 0, max: 50, rate: 0 },
            { min: 51, max: 60, rate: 20 },
            { min: 61, max: 70, rate: 40 },
            { min: 71, max: 80, rate: 60 },
            { min: 81, max: 90, rate: 80 },
            { min: 91, max: 100, rate: 100 }
          ]

      const applicableBand = kpiBands.find((b: any) => totalScore >= b.min && totalScore <= b.max) || { rate: 0 }

      // Commission calculation (as per PDF spec)
      const baseCommissionRate = config.commissionRate || 0.05
      const totalAgentCommissions = totalTransactionValue * baseCommissionRate
      const superAgentRate = config.superAgentCommissionRate || 0.2
      const eligibleSACommission = totalAgentCommissions * superAgentRate
      const fixedRate = config.superAgentFixedRate || 0.3
      const variableRate = config.superAgentVariableRate || 0.7
      const fixedCommission = eligibleSACommission * fixedRate
      const variableCommissionActual = eligibleSACommission * variableRate * (applicableBand.rate / 100)
      const finalCommission = fixedCommission + variableCommissionActual

      console.log(`KPI: ${totalScore.toFixed(1)}%, Band: ${applicableBand.rate}%, Commission: ${finalCommission}`)

      // Save KPI data
      await prisma.superAgentKPI.upsert({
        where: { superAgentId_period: { superAgentId, period } },
        create: {
          superAgentId,
          period,
          totalAgents,
          activeAgents,
          activenessScore: Math.round(activenessScore * 100) / 100,
          valueTransactedScore: Math.round(valueTransactedScore * 100) / 100,
          uniqueAgentsScore: Math.round(uniqueAgentsScore * 100) / 100,
          totalScore: Math.round(totalScore * 100) / 100,
          kpiBand: applicableBand.rate
        },
        update: {
          totalAgents,
          activeAgents,
          activenessScore: Math.round(activenessScore * 100) / 100,
          valueTransactedScore: Math.round(valueTransactedScore * 100) / 100,
          uniqueAgentsScore: Math.round(uniqueAgentsScore * 100) / 100,
          totalScore: Math.round(totalScore * 100) / 100,
          kpiBand: applicableBand.rate
        }
      })

      return {
        agentId: superAgentId,
        agentName: superAgent.name,
        agentType: 'super_agent',
        period,
        totalAmount: totalTransactionValue,
        transactionCount: totalTransactionCount,
        eligibleAmount: eligibleSACommission,
        commissionRate: superAgentRate,
        commissionAmount: variableCommissionActual,
        payband: applicableBand.rate,
        finalCommission,
        kpiDetails: {
          totalAgents,
          activeAgents,
          activenessScore: Math.round(activenessScore * 100) / 100,
          valueTransactedScore: Math.round(valueTransactedScore * 100) / 100,
          uniqueAgentsScore: Math.round(uniqueAgentsScore * 100) / 100,
          totalScore: Math.round(totalScore * 100) / 100,
          kpiBand: applicableBand.rate,
          fixedCommission,
          variableCommission: variableCommissionActual
        }
      }
    } catch (error) {
      console.error(`Error calculating Super Agent commission for ${superAgentId}:`, error)

      return null
    }
  }
}
