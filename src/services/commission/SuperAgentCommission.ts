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
      console.log(`Calculating Super Agent commission for agent ${superAgentId} for period ${period}`)

      // Get date range for the period
      const [year, month] = period.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

      // Get super agent info
      const superAgent = await prisma.agent.findUnique({
        where: { id: superAgentId },
        select: { id: true, name: true, type: true }
      })

      if (!superAgent) {
        console.log(`Super Agent ${superAgentId} not found`)

        return null
      }

      console.log(`Processing Super Agent: ${superAgent.name}`)

      // Get all local agents assigned to this super agent
      const agentAssignments = await prisma.agentAssignment.findMany({
        where: {
          superAgentId: superAgentId,
          status: 'active'
        },
        include: {
          localAgent: true
        }
      })

      if (agentAssignments.length === 0) {
        console.log(`No agents found for Super Agent ${superAgentId}`)

        return null
      }

      const totalAgents = agentAssignments.length
      const agentIds = agentAssignments.map(a => a.localAgentId)

      console.log(`Found ${totalAgents} agents under Super Agent ${superAgent.name}`)

      // Get transactions for all agents in this period
      const transactions = await prisma.transaction.groupBy({
        by: ['agentId'],
        where: {
          agentId: { in: agentIds },
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          status: 'completed'
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      })

      // Apply minimum threshold
      const minThreshold = config.minTransactionAmount || 100000
      const eligibleAgents = transactions.filter(t => (t._sum.amount || 0) >= minThreshold)

      const activeAgents = eligibleAgents.length
      const totalTransactionValue = eligibleAgents.reduce((sum, t) => sum + (t._sum.amount || 0), 0)
      const uniqueAgentsCount = new Set(eligibleAgents.map(t => t.agentId)).size
      const totalTransactionCount = eligibleAgents.reduce((sum, t) => sum + t._count.id, 0)

      console.log(`Eligible agents: ${activeAgents}/${totalAgents}`)
      console.log(`Total transaction value: ${totalTransactionValue}`)
      console.log(`Unique agents: ${uniqueAgentsCount}`)

      // Calculate KPI Scores
      const kpiWeights = config.kpiWeights
        ? typeof config.kpiWeights === 'string'
          ? JSON.parse(config.kpiWeights)
          : config.kpiWeights
        : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

      // 1. Agent Activeness Score (percentage of active vs total agents)
      const activenessScore = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0

      // 2. Value Transacted Score
      // Calculate expected transaction value based on historical data or set a target
      const monthlyTarget = 100000000 // This should be configurable, e.g., 100M TZS per month
      const valueTransactedScore = monthlyTarget > 0 ? Math.min((totalTransactionValue / monthlyTarget) * 100, 100) : 0

      // 3. Unique Agents Score (percentage of unique agents who transacted)
      const uniqueAgentsScore = totalAgents > 0 ? (uniqueAgentsCount / totalAgents) * 100 : 0

      // Calculate weighted total KPI score
      const totalScore =
        (activenessScore * kpiWeights.activeness) / 100 +
        (valueTransactedScore * kpiWeights.valueTransacted) / 100 +
        (uniqueAgentsScore * kpiWeights.uniqueAgents) / 100

      console.log(
        `KPI Scores - Activeness: ${activenessScore.toFixed(2)}%, Value: ${valueTransactedScore.toFixed(
          2
        )}%, Unique: ${uniqueAgentsScore.toFixed(2)}%`
      )
      console.log(`Total KPI Score: ${totalScore.toFixed(2)}%`)

      // Determine KPI Band
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

      const applicableBand = kpiBands.find((band: any) => totalScore >= band.min && totalScore <= band.max) || {
        min: 0,
        max: 50,
        rate: 0
      }

      console.log(`Applied KPI Band: ${applicableBand.rate}% (${applicableBand.min}-${applicableBand.max})`)

      // Calculate Commission
      // Total commission generated by local agents (assuming 5% base rate)
      const baseCommissionRate = config.commissionRate || 0.05
      const totalAgentCommissions = totalTransactionValue * baseCommissionRate

      // Super Agent gets percentage of total agent commissions
      const superAgentRate = config.superAgentCommissionRate || 0.2
      const eligibleSACommission = totalAgentCommissions * superAgentRate

      // Split into fixed and variable
      const fixedRate = config.superAgentFixedRate || 0.3
      const variableRate = config.superAgentVariableRate || 0.7

      const fixedCommission = eligibleSACommission * fixedRate
      const variableCommissionBase = eligibleSACommission * variableRate
      const variableCommissionActual = variableCommissionBase * (applicableBand.rate / 100)

      const finalCommission = fixedCommission + variableCommissionActual

      console.log(`Commission Calculation:`)
      console.log(`  Total Agent Commissions: ${totalAgentCommissions.toFixed(2)}`)
      console.log(
        `  Eligible SA Commission (${(superAgentRate * 100).toFixed(1)}%): ${eligibleSACommission.toFixed(2)}`
      )
      console.log(`  Fixed Commission (${(fixedRate * 100).toFixed(0)}%): ${fixedCommission.toFixed(2)}`)
      console.log(`  Variable Commission (${(variableRate * 100).toFixed(0)}%): ${variableCommissionActual.toFixed(2)}`)
      console.log(`  Final Commission: ${finalCommission.toFixed(2)}`)

      // Save KPI data
      await prisma.superAgentKPI.upsert({
        where: {
          superAgentId_period: {
            superAgentId,
            period
          }
        },
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
