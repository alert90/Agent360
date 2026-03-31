import { prisma } from '../../lib/db'
import { SuperAgentCommission } from './SuperAgentCommission'
import { FranchiseCommission } from './FranchiseCommission'

interface CommissionResult {
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
  clawback?: number
  performance?: any
  kpiDetails?: any
}

export class CommissionCalculator {
  private superAgentCalc = new SuperAgentCommission()
  private franchiseCalc = new FranchiseCommission()

  async calculateMonthly(period: string, agentType?: string) {
    console.log(`Starting commission calculation for ${period}...`)

    // Get active commission configuration
    const activeConfig = await prisma.commissionConfig.findFirst({
      where: { isActive: 1, status: 'active' }
    })

    if (!activeConfig) {
      throw new Error('No active commission configuration found')
    }

    console.log(`Using config: ${activeConfig.title}`)

    // Parse period to get date range
    const [year, month] = period.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    // Get all agents
    const where: any = { isActive: 1 }
    if (agentType && agentType !== 'all') {
      where.type = agentType
    }

    const agents = await prisma.agent.findMany({
      where,
      select: { id: true, type: true, name: true }
    })

    console.log(`Processing ${agents.length} agents...`)

    const results: CommissionResult[] = []
    const batchSize = 100

    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(agents.length / batchSize)}`)

      const batchResults = await Promise.all(
        batch.map(async agent => {
          try {
            let result: CommissionResult | null = null

            if (agent.type === 'super_agent') {
              // Use SuperAgentCommission class for super agents
              const superAgentResult = await this.superAgentCalc.calculate(agent.id, period, activeConfig)
              if (superAgentResult) {
                result = {
                  agentId: superAgentResult.agentId,
                  agentName: superAgentResult.agentName || 'Unknown Agent',
                  agentType: superAgentResult.agentType,
                  period: superAgentResult.period,
                  totalAmount: superAgentResult.totalAmount,
                  transactionCount: superAgentResult.transactionCount,
                  eligibleAmount: superAgentResult.eligibleAmount,
                  commissionRate: superAgentResult.commissionRate,
                  commissionAmount: superAgentResult.commissionAmount,
                  payband: superAgentResult.payband,
                  finalCommission: superAgentResult.finalCommission,
                  kpiDetails: superAgentResult.kpiDetails
                }
              }
            } else if (agent.type === 'franchise') {
              // Get capital advanced for this franchise
              const capitalAdvancedRecord = await prisma.capitalAdvanced.findFirst({
                where: {
                  franchiseId: agent.id,
                  period
                }
              })
              const capitalAdvanced = capitalAdvancedRecord?.amount || 1000000

              // Use FranchiseCommission class for franchises
              const franchiseResult = await this.franchiseCalc.calculate(
                agent.id,
                period,
                activeConfig,
                capitalAdvanced
              )
              if (franchiseResult) {
                result = {
                  agentId: franchiseResult.agentId,
                  agentName: franchiseResult.agentName || 'Unknown Agent',
                  agentType: franchiseResult.agentType,
                  period: franchiseResult.period,
                  totalAmount: franchiseResult.totalAmount,
                  transactionCount: franchiseResult.transactionCount,
                  eligibleAmount: franchiseResult.eligibleAmount,
                  commissionRate: franchiseResult.commissionRate,
                  commissionAmount: franchiseResult.commissionAmount,
                  payband: franchiseResult.payband,
                  finalCommission: franchiseResult.finalCommission,
                  clawback: franchiseResult.clawback,
                  performance: franchiseResult.performance
                }
              }
            } else {
              // Local agent - simple calculation
              const transactions = await prisma.transaction.aggregate({
                where: {
                  agentId: agent.id,
                  timestamp: {
                    gte: startDate,
                    lte: endDate
                  },
                  status: 'completed'
                },
                _sum: { amount: true },
                _count: { id: true }
              })

              const totalAmount = transactions._sum.amount || 0
              const transactionCount = transactions._count.id || 0
              const minTransactionAmount = activeConfig.minTransactionAmount || 100000
              const isEligible = totalAmount >= minTransactionAmount
              const commissionRate = activeConfig.commissionRate || 0.05
              const commissionAmount = isEligible ? totalAmount * commissionRate : 0

              result = {
                agentId: agent.id,
                agentName: agent.name || 'Unknown Agent',
                agentType: 'local_agent',
                period,
                totalAmount,
                transactionCount,
                eligibleAmount: isEligible ? totalAmount : 0,
                commissionRate,
                commissionAmount,
                payband: 1,
                finalCommission: commissionAmount
              }
            }

            if (result) {
              // Ensure agentName is never undefined
              const saveData = {
                ...result,
                agentName: result.agentName || 'Unknown Agent',
                performance: result.performance ? JSON.stringify(result.performance) : null,
                kpiDetails: result.kpiDetails ? JSON.stringify(result.kpiDetails) : null
              }

              // Save to database
              await prisma.commission.upsert({
                where: {
                  agentId_period: {
                    agentId: agent.id,
                    period
                  }
                },
                update: {
                  agentId: saveData.agentId,
                  agentName: saveData.agentName,
                  agentType: saveData.agentType,
                  period: saveData.period,
                  totalAmount: saveData.totalAmount,
                  transactionCount: saveData.transactionCount,
                  eligibleAmount: saveData.eligibleAmount,
                  commissionRate: saveData.commissionRate,
                  commissionAmount: saveData.commissionAmount,
                  payband: saveData.payband,
                  finalCommission: saveData.finalCommission,
                  clawback: saveData.clawback || 0,
                  performance: saveData.performance,
                  updatedAt: new Date()
                },
                create: {
                  agentId: saveData.agentId,
                  agentName: saveData.agentName,
                  agentType: saveData.agentType,
                  period: saveData.period,
                  totalAmount: saveData.totalAmount,
                  transactionCount: saveData.transactionCount,
                  eligibleAmount: saveData.eligibleAmount,
                  commissionRate: saveData.commissionRate,
                  commissionAmount: saveData.commissionAmount,
                  payband: saveData.payband,
                  finalCommission: saveData.finalCommission,
                  clawback: saveData.clawback || 0,
                  performance: saveData.performance,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              })
            }

            return result
          } catch (error) {
            console.error(`Error calculating for agent ${agent.id}:`, error)

            return null
          }
        })
      )

      const validResults = batchResults.filter((r): r is CommissionResult => r !== null)
      results.push(...validResults)
    }

    // Update agent commission amounts
    for (const result of results) {
      await prisma.agent.update({
        where: { id: result.agentId },
        data: {
          commissionAmount: result.finalCommission,
          updatedAt: new Date()
        }
      })
    }

    const summary = {
      period,
      totalAgents: results.length,
      totalCommission: results.reduce((sum, r) => sum + (r.finalCommission || 0), 0),
      totalAmount: results.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
      byType: {
        super_agent: results.filter(r => r.agentType === 'super_agent').length,
        franchise: results.filter(r => r.agentType === 'franchise').length,
        local_agent: results.filter(r => r.agentType === 'local_agent').length
      }
    }

    console.log('Calculation complete:', summary)

    return { results, summary }
  }

  // Method to calculate commissions for a single agent
  async calculateForAgent(agentId: number, period: string) {
    const activeConfig = await prisma.commissionConfig.findFirst({
      where: { isActive: 1, status: 'active' }
    })

    if (!activeConfig) {
      throw new Error('No active commission configuration found')
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, type: true, name: true }
    })

    if (!agent) {
      throw new Error('Agent not found')
    }

    const [year, month] = period.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    let result: CommissionResult | null = null

    if (agent.type === 'super_agent') {
      const superAgentResult = await this.superAgentCalc.calculate(agent.id, period, activeConfig)
      if (superAgentResult) {
        result = {
          agentId: superAgentResult.agentId,
          agentName: superAgentResult.agentName || 'Unknown Agent',
          agentType: superAgentResult.agentType,
          period: superAgentResult.period,
          totalAmount: superAgentResult.totalAmount,
          transactionCount: superAgentResult.transactionCount,
          eligibleAmount: superAgentResult.eligibleAmount,
          commissionRate: superAgentResult.commissionRate,
          commissionAmount: superAgentResult.commissionAmount,
          payband: superAgentResult.payband,
          finalCommission: superAgentResult.finalCommission,
          kpiDetails: superAgentResult.kpiDetails
        }
      }
    } else if (agent.type === 'franchise') {
      const capitalAdvancedRecord = await prisma.capitalAdvanced.findFirst({
        where: {
          franchiseId: agent.id,
          period
        }
      })
      const capitalAdvanced = capitalAdvancedRecord?.amount || 1000000

      const franchiseResult = await this.franchiseCalc.calculate(agent.id, period, activeConfig, capitalAdvanced)
      if (franchiseResult) {
        result = {
          agentId: franchiseResult.agentId,
          agentName: franchiseResult.agentName || 'Unknown Agent',
          agentType: franchiseResult.agentType,
          period: franchiseResult.period,
          totalAmount: franchiseResult.totalAmount,
          transactionCount: franchiseResult.transactionCount,
          eligibleAmount: franchiseResult.eligibleAmount,
          commissionRate: franchiseResult.commissionRate,
          commissionAmount: franchiseResult.commissionAmount,
          payband: franchiseResult.payband,
          finalCommission: franchiseResult.finalCommission,
          clawback: franchiseResult.clawback,
          performance: franchiseResult.performance
        }
      }
    } else {
      // Local agent
      const transactions = await prisma.transaction.aggregate({
        where: {
          agentId: agent.id,
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          status: 'completed'
        },
        _sum: { amount: true },
        _count: { id: true }
      })

      const totalAmount = transactions._sum.amount || 0
      const transactionCount = transactions._count.id || 0
      const minTransactionAmount = activeConfig.minTransactionAmount || 100000
      const isEligible = totalAmount >= minTransactionAmount
      const commissionRate = activeConfig.commissionRate || 0.05
      const commissionAmount = isEligible ? totalAmount * commissionRate : 0

      result = {
        agentId: agent.id,
        agentName: agent.name || 'Unknown Agent',
        agentType: 'local_agent',
        period,
        totalAmount,
        transactionCount,
        eligibleAmount: isEligible ? totalAmount : 0,
        commissionRate,
        commissionAmount,
        payband: 1,
        finalCommission: commissionAmount
      }
    }

    if (result) {
      // Save to database
      await prisma.commission.upsert({
        where: {
          agentId_period: {
            agentId: agent.id,
            period
          }
        },
        update: {
          agentName: result.agentName,
          agentType: result.agentType,
          totalAmount: result.totalAmount,
          transactionCount: result.transactionCount,
          eligibleAmount: result.eligibleAmount,
          commissionRate: result.commissionRate,
          commissionAmount: result.commissionAmount,
          payband: result.payband,
          finalCommission: result.finalCommission,
          clawback: result.clawback || 0,
          performance: result.performance ? JSON.stringify(result.performance) : null,
          updatedAt: new Date()
        },
        create: {
          agentId: result.agentId,
          agentName: result.agentName,
          agentType: result.agentType,
          period: result.period,
          totalAmount: result.totalAmount,
          transactionCount: result.transactionCount,
          eligibleAmount: result.eligibleAmount,
          commissionRate: result.commissionRate,
          commissionAmount: result.commissionAmount,
          payband: result.payband,
          finalCommission: result.finalCommission,
          clawback: result.clawback || 0,
          performance: result.performance ? JSON.stringify(result.performance) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Update agent commission amount
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          commissionAmount: result.finalCommission,
          updatedAt: new Date()
        }
      })
    }

    return result
  }
}
