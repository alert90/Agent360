// src/services/commission/FranchiseCommission.ts
import { prisma } from '../../lib/db'

interface FranchiseResult {
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
  clawback: number
  performance: {
    totalCapitalAdvanced: number
    expectedTurnover: number
    actualTurnover: number
    performancePercentage: number
    paybandLevel: string
    apportionRate: number
    clawbackAmount: number
  }
}

export class FranchiseCommission {
  async calculate(
    franchiseId: number,
    period: string,
    config: any,
    capitalAdvanced: number
  ): Promise<FranchiseResult | null> {
    try {
      console.log(`Calculating Franchise commission for agent ${franchiseId} for period ${period}`)

      // Get date range for the period
      const [year, month] = period.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

      // Get franchise info
      const franchise = await prisma.agent.findUnique({
        where: { id: franchiseId },
        select: { id: true, name: true, type: true }
      })

      if (!franchise) {
        console.log(`Franchise ${franchiseId} not found`)

        return null
      }

      console.log(`Processing Franchise: ${franchise.name}`)

      // Get all agents assigned to this franchise
      const agentAssignments = await prisma.agentAssignment.findMany({
        where: {
          franchiseId: franchiseId,
          status: 'active'
        },
        include: {
          localAgent: true
        }
      })

      if (agentAssignments.length === 0) {
        console.log(`No agents found for Franchise ${franchiseId}`)

        return null
      }

      const agentIds = agentAssignments.map(a => a.localAgentId)
      console.log(`Found ${agentIds.length} agents under Franchise ${franchise.name}`)

      // Get transactions for all assigned agents in this period
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

      // Calculate total turnover (actual transactions)
      const actualTurnover = transactions.reduce((sum, t) => sum + (t._sum.amount || 0), 0)
      const totalTransactionCount = transactions.reduce((sum, t) => sum + t._count.id, 0)

      console.log(`Capital Advanced: ${capitalAdvanced}`)
      console.log(`Actual Turnover: ${actualTurnover}`)

      // Calculate expected turnover
      const multiplier = config.franchiseMultiplier || 4.5
      const expectedTurnover = capitalAdvanced * multiplier

      console.log(`Expected Turnover (${multiplier}x): ${expectedTurnover}`)

      // Calculate performance percentage
      const performancePercentage = expectedTurnover > 0 ? (actualTurnover / expectedTurnover) * 100 : 0

      console.log(`Performance: ${performancePercentage.toFixed(2)}%`)

      // Get payband configuration
      const paybands = config.paybandRates
        ? typeof config.paybandRates === 'string'
          ? JSON.parse(config.paybandRates)
          : config.paybandRates
        : [
            { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
            { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
            { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
            { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
            { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
          ]

      // Find applicable payband
      const applicablePayband = paybands.find((band: any) => {
        const perfRounded = Math.floor(performancePercentage)

        return perfRounded >= band.min && (band.max === Infinity || perfRounded <= band.max)
      })

      if (!applicablePayband) {
        console.log(`No payband found for performance ${performancePercentage}%`)

        return null
      }

      console.log(`Applied Payband: ${applicablePayband.name} (${applicablePayband.apportionRate * 100}% apportion)`)

      // Calculate base commission
      const baseCommissionRate = config.franchiseBaseRate || 0.0005 // 0.05%
      const baseCommission = actualTurnover * baseCommissionRate

      // Apply apportion rate
      const finalCommission = baseCommission * applicablePayband.apportionRate

      // Calculate clawback
      const clawbackAmount = baseCommission * (applicablePayband.clawbackPercentage / 100)

      console.log(`Commission Calculation:`)
      console.log(`  Base Commission (${(baseCommissionRate * 100).toFixed(2)}%): ${baseCommission.toFixed(2)}`)
      console.log(`  Apportion Rate: ${(applicablePayband.apportionRate * 100).toFixed(0)}%`)
      console.log(`  Final Commission: ${finalCommission.toFixed(2)}`)
      console.log(`  Clawback: ${clawbackAmount.toFixed(2)}`)

      // Save franchise performance data
      await prisma.franchisePerformance.upsert({
        where: {
          franchiseId_period: {
            franchiseId,
            period
          }
        },
        create: {
          franchiseId,
          period,
          totalCapitalAdvanced: capitalAdvanced,
          expectedTurnover,
          actualTurnover,
          performancePct: Math.round(performancePercentage * 100) / 100,
          paybandLevel: applicablePayband.name,
          apportionRate: applicablePayband.apportionRate,
          clawbackAmount
        },
        update: {
          totalCapitalAdvanced: capitalAdvanced,
          expectedTurnover,
          actualTurnover,
          performancePct: Math.round(performancePercentage * 100) / 100,
          paybandLevel: applicablePayband.name,
          apportionRate: applicablePayband.apportionRate,
          clawbackAmount
        }
      })

      return {
        agentId: franchiseId,
        agentName: franchise.name,
        agentType: 'franchise',
        period,
        totalAmount: actualTurnover,
        transactionCount: totalTransactionCount,
        eligibleAmount: baseCommission,
        commissionRate: baseCommissionRate,
        commissionAmount: baseCommission,
        payband: performancePercentage,
        finalCommission,
        clawback: clawbackAmount,
        performance: {
          totalCapitalAdvanced: capitalAdvanced,
          expectedTurnover,
          actualTurnover,
          performancePercentage: Math.round(performancePercentage * 100) / 100,
          paybandLevel: applicablePayband.name,
          apportionRate: applicablePayband.apportionRate,
          clawbackAmount
        }
      }
    } catch (error) {
      console.error(`Error calculating Franchise commission for ${franchiseId}:`, error)

      return null
    }
  }
}
