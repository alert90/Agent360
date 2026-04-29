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
  async calculate(franchiseId: number, period: string, config: any): Promise<FranchiseResult | null> {
    try {
      const [year, month] = period.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

      const franchise = await prisma.agent.findUnique({
        where: { id: franchiseId },
        select: { id: true, name: true, type: true, accountNumber: true }
      })

      if (!franchise) {
        console.log(`Franchise ${franchiseId} not found`)

        return null
      }

      console.log(`Processing Franchise: ${franchise.name}`)

      // Get detected agents (deposits TO agents = capital advanced)
      const detectedAgents = await prisma.$queryRaw<any[]>`
        SELECT
          t."customer_account" as account_number,
          COUNT(*)::integer as transaction_count,
          SUM(t.amount) as total_amount
        FROM "transactions" t
        WHERE t."agent_id" = ${franchiseId}
          AND t."type" IN ('deposit', 'transfer')
          AND t."customer_account" IS NOT NULL
          AND t."customer_account" LIKE '01J7%'
          AND t."customer_account" != ${franchise.accountNumber}
          AND t."timestamp" >= ${startDate}
          AND t."timestamp" <= ${endDate}
          AND t."status" = 'completed'
        GROUP BY t."customer_account"
        HAVING COUNT(*) >= 1
        ORDER BY transaction_count DESC, total_amount DESC
      `

      if (detectedAgents.length === 0) {
        console.log(`No transaction-detected agents for Franchise ${franchiseId}`)

        return null
      }

      // Capital Advanced = total deposits TO agent accounts
      const totalCapitalAdvanced = detectedAgents.reduce((sum: number, a: any) => sum + Number(a.total_amount), 0)
      const totalTransactionCount = detectedAgents.reduce((sum: number, a: any) => sum + a.transaction_count, 0)

      console.log(`Detected agents: ${detectedAgents.length}, Capital Advanced: ${totalCapitalAdvanced}`)

      // Get actual turnover (transactions FROM those detected agents)
      const accountNumbers = detectedAgents.map((a: any) => a.account_number)
      const existingAgents = await prisma.agent.findMany({
        where: { accountNumber: { in: accountNumbers } },
        select: { id: true }
      })
      const agentIds = existingAgents.map(a => a.id)

      let actualTurnover = 0
      if (agentIds.length > 0) {
        const turnoverResult = await prisma.transaction.aggregate({
          where: {
            agentId: { in: agentIds },
            timestamp: { gte: startDate, lte: endDate },
            status: 'completed'
          },
          _sum: { amount: true }
        })
        actualTurnover = turnoverResult._sum.amount || 0
      }

      console.log(`Actual Turnover: ${actualTurnover}`)

      // Calculate expected turnover
      const multiplier = config.franchiseMultiplier || 4.5
      const expectedTurnover = totalCapitalAdvanced * multiplier

      // Performance percentage - cap at 100%
      const performancePercentage = expectedTurnover > 0 ? Math.min((actualTurnover / expectedTurnover) * 100, 100) : 0

      console.log(`Performance: ${performancePercentage.toFixed(2)}%`)

      // Paybands
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

      const perfRounded = Math.floor(performancePercentage)
      const applicablePayband = paybands.find(
        (band: any) =>
          perfRounded >= band.min && (band.max === Infinity || band.max === null || perfRounded <= band.max)
      )

      if (!applicablePayband) {
        console.log(`No payband found for performance ${performancePercentage}%`)

        return null
      }

      // Commission calculation (as per PDF spec)
      const baseCommissionRate = config.franchiseBaseRate || 0.0005
      const baseCommission = actualTurnover * baseCommissionRate
      const finalCommission = baseCommission * applicablePayband.apportionRate
      const clawbackAmount = baseCommission * (applicablePayband.clawbackPercentage / 100)

      console.log(`Payband: ${applicablePayband.name}, Commission: ${finalCommission}, Clawback: ${clawbackAmount}`)

      // Save performance data
      await prisma.franchisePerformance.upsert({
        where: { franchiseId_period: { franchiseId, period } },
        create: {
          franchiseId,
          period,
          totalCapitalAdvanced,
          expectedTurnover,
          actualTurnover,
          performancePct: Math.round(performancePercentage * 100) / 100,
          paybandLevel: applicablePayband.name,
          apportionRate: applicablePayband.apportionRate,
          clawbackAmount
        },
        update: {
          totalCapitalAdvanced,
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
          totalCapitalAdvanced,
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
