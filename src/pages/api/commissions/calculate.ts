// src/pages/api/commissions/calculate.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, agentType } = req.body

    if (!period) {
      return res.status(400).json({ error: 'Period is required (YYYY-MM)' })
    }

    const dbType = agentType === 'super_agent' ? 'super_agent' : agentType === 'franchise' ? 'franchise' : null
    if (!dbType) {
      return res.status(400).json({ error: 'Valid agentType is required (super_agent or franchise)' })
    }

    const configType = dbType === 'super_agent' ? 'SUPER_AGENT' : 'FRANCHISE'

    const config = await prisma.commissionConfig.findFirst({
      where: { type: configType, status: 'active', isActive: 1 }
    })

    if (!config) {
      return res.status(400).json({ error: `No active ${configType} commission configuration found` })
    }

    console.log(`Using config: ${config.title} for ${dbType}s, period: ${period}`)

    const [year, month] = period.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    const agents = await prisma.agent.findMany({
      where: { type: dbType, isActive: 1 },
      select: { id: true, name: true, type: true, accountNumber: true }
    })

    console.log(`Found ${agents.length} ${dbType} agents`)
    const results: any[] = []

    for (const agent of agents) {
      try {
        const detectedAgents = await prisma.$queryRaw<any[]>`
          SELECT
            t."customer_account" as account_number,
            COUNT(*)::integer as transaction_count,
            SUM(t.amount) as total_amount
          FROM "transactions" t
          WHERE t."agent_id" = ${agent.id}
            AND t."type" IN ('deposit', 'transfer')
            AND t."customer_account" IS NOT NULL
            AND t."customer_account" LIKE '01J7%'
            AND t."customer_account" != ${agent.accountNumber}
            AND t."timestamp" >= ${startDate}
            AND t."timestamp" <= ${endDate}
            AND t."status" = 'completed'
          GROUP BY t."customer_account"
          HAVING COUNT(*) >= 1
          ORDER BY transaction_count DESC, total_amount DESC
        `

        if (detectedAgents.length === 0) continue

        const totalDetected = detectedAgents.length
        const totalDetectedAmount = detectedAgents.reduce((s: number, a: any) => s + Number(a.total_amount), 0)
        const totalDetectedCount = detectedAgents.reduce((s: number, a: any) => s + a.transaction_count, 0)

        if (dbType === 'super_agent') {
          const kpiWeights = config.kpiWeights
            ? typeof config.kpiWeights === 'string'
              ? JSON.parse(config.kpiWeights)
              : config.kpiWeights
            : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

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

          const minThreshold = config.minTransactionAmount || 100000
          const eligibleAgents = detectedAgents.filter((a: any) => Number(a.total_amount) >= minThreshold)
          const activeAgents = eligibleAgents.length
          const totalTransactionValue = eligibleAgents.reduce((s: number, a: any) => s + Number(a.total_amount), 0)
          const uniqueAgentsCount = new Set(eligibleAgents.map((a: any) => a.account_number)).size

          const activenessScore = totalDetected > 0 ? (activeAgents / totalDetected) * 100 : 0
          const valueScore = Math.min((totalTransactionValue / 100000000) * 100, 100)
          const uniqueScore = totalDetected > 0 ? (uniqueAgentsCount / totalDetected) * 100 : 0

          const totalKPIScore =
            (activenessScore * kpiWeights.activeness +
              valueScore * kpiWeights.valueTransacted +
              uniqueScore * kpiWeights.uniqueAgents) /
            100

          const applicableBand = kpiBands.find((b: any) => totalKPIScore >= b.min && totalKPIScore <= b.max) || {
            rate: 0
          }

          const baseCommission = totalTransactionValue * (config.commissionRate || 0.05)
          const saRate = config.superAgentCommissionRate || 0.2
          const eligibleSACommission = baseCommission * saRate
          const fixedCommission = eligibleSACommission * (config.superAgentFixedRate || 0.3)
          const variableCommission =
            eligibleSACommission * (config.superAgentVariableRate || 0.7) * (applicableBand.rate / 100)
          const finalCommission = fixedCommission + variableCommission

          // Try to save KPI - ignore if table doesn't exist
          try {
            await prisma.superAgentKPI.upsert({
              where: { superAgentId_period: { superAgentId: agent.id, period } },
              create: {
                superAgentId: agent.id,
                period,
                totalAgents: totalDetected,
                activeAgents,
                activenessScore: Math.round(activenessScore * 100) / 100,
                valueTransactedScore: Math.round(valueScore * 100) / 100,
                uniqueAgentsScore: Math.round(uniqueScore * 100) / 100,
                totalScore: Math.round(totalKPIScore * 100) / 100,
                kpiBand: applicableBand.rate
              },
              update: {
                totalAgents: totalDetected,
                activeAgents,
                activenessScore: Math.round(activenessScore * 100) / 100,
                valueTransactedScore: Math.round(valueScore * 100) / 100,
                uniqueAgentsScore: Math.round(uniqueScore * 100) / 100,
                totalScore: Math.round(totalKPIScore * 100) / 100,
                kpiBand: applicableBand.rate
              }
            })
          } catch (e) {
            console.log('superAgentKPI table not available, skipping save')
          }

          // Save commission super agent
          try {
            await prisma.commission.upsert({
              where: {
                agent_id_period: {
                  agent_id: agent.id,
                  period
                }
              },
              create: {
                agent_id: agent.id,
                agent_name: agent.name,
                agent_type: 'super_agent',
                period,
                transaction_count: totalDetectedCount,
                total_amount: totalTransactionValue,
                eligible_amount: eligibleSACommission,
                commission_rate: saRate,
                commission_amount: variableCommission,
                payband: applicableBand.rate,
                final_commission: finalCommission,
                clawback_amount: 0,
                calculation_details: JSON.stringify({
                  totalAgents: totalDetected,
                  activeAgents,
                  activenessScore,
                  valueTransactedScore: valueScore,
                  uniqueAgentsScore: uniqueScore,
                  totalScore: totalKPIScore,
                  kpiBand: applicableBand.rate,
                  fixedCommission,
                  variableCommission
                }),
                created_at: new Date(),
                updated_at: new Date()
              },
              update: {
                transaction_count: totalDetectedCount,
                total_amount: totalTransactionValue,
                eligible_amount: eligibleSACommission,
                commission_rate: saRate,
                commission_amount: variableCommission,
                payband: applicableBand.rate,
                final_commission: finalCommission,
                clawback_amount: 0,
                calculation_details: JSON.stringify({
                  totalAgents: totalDetected,
                  activeAgents,
                  activenessScore,
                  valueTransactedScore: valueScore,
                  uniqueAgentsScore: uniqueScore,
                  totalScore: totalKPIScore,
                  kpiBand: applicableBand.rate,
                  fixedCommission,
                  variableCommission
                }),
                updated_at: new Date()
              }
            })
            console.log(`Saved commission for ${agent.name}`)
          } catch (e) {
            console.log('commission save error:', e)
          }

          // Update agent
          try {
            await prisma.agent.update({
              where: { id: agent.id },
              data: { commissionAmount: finalCommission, updatedAt: new Date() }
            })
          } catch (e) {}

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            agentType: 'super_agent',
            accountNumber: agent.accountNumber,
            period,
            totalAmount: totalTransactionValue,
            transactionCount: totalDetectedCount,
            eligibleAmount: eligibleSACommission,
            commissionRate: saRate,
            commissionAmount: variableCommission,
            payband: applicableBand.rate,
            finalCommission,
            kpiDetails: {
              totalAgents: totalDetected,
              activeAgents,
              activenessScore: Math.round(activenessScore * 100) / 100,
              valueTransactedScore: Math.round(valueScore * 100) / 100,
              uniqueAgentsScore: Math.round(uniqueScore * 100) / 100,
              totalScore: Math.round(totalKPIScore * 100) / 100,
              kpiBand: applicableBand.rate,
              fixedCommission,
              variableCommission
            }
          })
        } else {
          // Franchise
          const multiplier = config.franchiseMultiplier || 4.5
          const baseRate = config.franchiseBaseRate || 0.0005
          const totalCapitalAdvanced = totalDetectedAmount

          const accountNumbers = detectedAgents.map((a: any) => a.account_number)
          const existingAgents = await prisma.agent.findMany({
            where: { accountNumber: { in: accountNumbers } },
            select: { id: true }
          })
          const agentIds = existingAgents.map(a => a.id)

          let actualTurnover = totalDetectedAmount
          if (agentIds.length > 0) {
            const turnoverAgg = await prisma.transaction.aggregate({
              where: { agentId: { in: agentIds }, timestamp: { gte: startDate, lte: endDate }, status: 'completed' },
              _sum: { amount: true }
            })
            actualTurnover = turnoverAgg._sum.amount || totalDetectedAmount
          }

          const expectedTurnover = totalCapitalAdvanced * multiplier
          const performancePct = expectedTurnover > 0 ? Math.min((actualTurnover / expectedTurnover) * 100, 100) : 0

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

          const pr = Math.floor(performancePct)
          const pb =
            paybands.find((b: any) => pr >= b.min && (b.max === Infinity || b.max === null || pr <= b.max)) ||
            paybands[paybands.length - 1]
          const baseCommission = actualTurnover * baseRate
          const finalCommission = baseCommission * pb.apportionRate
          const clawback = baseCommission * (pb.clawbackPercentage / 100)

          // Try to save franchise performance
          try {
            await prisma.franchisePerformance.upsert({
              where: { franchiseId_period: { franchiseId: agent.id, period } },
              create: {
                franchiseId: agent.id,
                period,
                totalCapitalAdvanced,
                expectedTurnover,
                actualTurnover,
                performancePct: Math.round(performancePct * 100) / 100,
                paybandLevel: pb.name,
                apportionRate: pb.apportionRate,
                clawbackAmount: clawback
              },
              update: {
                totalCapitalAdvanced,
                expectedTurnover,
                actualTurnover,
                performancePct: Math.round(performancePct * 100) / 100,
                paybandLevel: pb.name,
                apportionRate: pb.apportionRate,
                clawbackAmount: clawback
              }
            })
          } catch (e) {
            console.log('franchisePerformance table not available, skipping save')
          }

          // Save commission
          try {
            await prisma.commission.upsert({
              where: {
                agent_id_period: {
                  agent_id: agent.id,
                  period
                }
              },
              create: {
                agent_id: agent.id,
                agent_name: agent.name,
                agent_type: 'franchise',
                period,
                transaction_count: totalDetectedCount,
                total_amount: actualTurnover,
                eligible_amount: baseCommission,
                commission_rate: baseRate,
                commission_amount: baseCommission,
                payband: performancePct,
                final_commission: finalCommission,
                clawback_amount: clawback,
                calculation_details: JSON.stringify({
                  totalCapitalAdvanced,
                  expectedTurnover,
                  actualTurnover,
                  performancePercentage: Math.round(performancePct * 100) / 100,
                  paybandLevel: pb.name,
                  apportionRate: pb.apportionRate,
                  clawbackAmount: clawback
                }),
                created_at: new Date(),
                updated_at: new Date()
              },
              update: {
                transaction_count: totalDetectedCount,
                total_amount: actualTurnover,
                eligible_amount: baseCommission,
                commission_rate: baseRate,
                commission_amount: baseCommission,
                payband: performancePct,
                final_commission: finalCommission,
                clawback_amount: clawback,
                calculation_details: JSON.stringify({
                  totalCapitalAdvanced,
                  expectedTurnover,
                  actualTurnover,
                  performancePercentage: Math.round(performancePct * 100) / 100,
                  paybandLevel: pb.name,
                  apportionRate: pb.apportionRate,
                  clawbackAmount: clawback
                }),
                updated_at: new Date()
              }
            })
            console.log(`Saved commission for ${agent.name}`)
          } catch (e) {
            console.log('commission save error:', e)
          }

          try {
            await prisma.agent.update({
              where: { id: agent.id },
              data: { commissionAmount: finalCommission, updatedAt: new Date() }
            })
          } catch (e) {}

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            agentType: 'franchise',
            accountNumber: agent.accountNumber,
            period,
            totalAmount: actualTurnover,
            transactionCount: totalDetectedCount,
            eligibleAmount: baseCommission,
            commissionRate: baseRate,
            commissionAmount: baseCommission,
            payband: performancePct,
            finalCommission,
            clawback,
            performance: {
              totalCapitalAdvanced,
              expectedTurnover,
              actualTurnover,
              performancePercentage: Math.round(performancePct * 100) / 100,
              paybandLevel: pb.name,
              apportionRate: pb.apportionRate,
              clawbackAmount: clawback
            }
          })
        }
      } catch (err) {
        console.error(`Error for agent ${agent.id}:`, err)
      }
    }

    const summary = {
      period,
      totalAgents: results.length,
      totalCommission: results.reduce((s: number, r: any) => s + r.finalCommission, 0),
      totalAmount: results.reduce((s: number, r: any) => s + r.totalAmount, 0)
    }

    console.log(`Calculation complete: ${results.length} agents`)
    res.status(200).json({ success: true, period, summary, results })
  } catch (error) {
    console.error('Commission calculation error:', error)
    res.status(500).json({
      error: 'Failed to calculate commissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
