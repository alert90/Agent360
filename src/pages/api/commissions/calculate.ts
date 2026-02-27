import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'POST') {
      const { period, configId } = req.body

      if (!period) {
        return res.status(400).json({
          success: false,
          message: 'Period is required (format: YYYY-MM)'
        })
      }

      // Get active commission configuration
      let configQuery = `
        SELECT * FROM commission_configs
        WHERE is_active = 1
      `
      const configParams: any[] = []

      if (configId) {
        configQuery += ' AND id = ?'
        configParams.push(configId)
      } else {
        configQuery += ' ORDER BY created_at DESC LIMIT 1'
      }

      const config = db.prepare(configQuery).get(...configParams) as any

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'No active commission configuration found'
        })
      }

      // Parse KPI weights
      const kpiWeights = config.kpi_weights
        ? JSON.parse(config.kpi_weights)
        : {
            activeness: 55,
            valueTransacted: 25,
            uniqueAgents: 20
          }

      // Calculate commissions for all agents
      const calculations = []

      // Get all active agents
      const agents = db.prepare('SELECT * FROM agents WHERE is_active = 1').all() as any[]

      for (const agent of agents) {
        let commissionAmount = 0
        let calculationDetails = {}

        // Get agent's transactions for the period
        const agentTransactions = db
          .prepare(
            `
          SELECT
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            SUM(commission_amount) as current_commission
          FROM transactions
          WHERE agent_id = ?
            AND strftime('%Y-%m', timestamp) = ?
            AND status = 'completed'
        `
          )
          .get(agent.id, period) as any

        const transactionCount = agentTransactions?.transaction_count || 0
        const totalAmount = agentTransactions?.total_amount || 0

        if (agent.type === 'local_agent') {
          // Local agent: direct commission on transactions
          commissionAmount = totalAmount * config.commission_rate

          calculationDetails = {
            type: 'local_agent',
            baseRate: config.commission_rate,
            transactionCount,
            totalAmount,
            commissionAmount
          }
        } else if (agent.type === 'super_agent') {
          // Super agent: commission from agents they serve
          const servedAgents = db
            .prepare(
              `
            SELECT COUNT(*) as count FROM agents
            WHERE parent_agent_id = ? AND is_active = 1 AND type = 'local_agent'
          `
            )
            .get(agent.id) as any

          const servedAgentCount = servedAgents?.count || 0

          // Calculate KPI scores
          const activenessScore = transactionCount > 0 ? 100 : 0 // Simplified
          const valueScore = totalAmount > 100000 ? Math.min(totalAmount / 100000, 100) : 0 // Simplified
          const uniqueAgentsScore = servedAgentCount > 0 ? Math.min((servedAgentCount / 10) * 100, 100) : 0 // Simplified

          const totalKPIScore =
            (activenessScore * kpiWeights.activeness) / 100 +
            (valueScore * kpiWeights.valueTransacted) / 100 +
            (uniqueAgentsScore * kpiWeights.uniqueAgents) / 100

          // Only get commission if KPI >= 50
          if (totalKPIScore >= 50) {
            const baseCommission = totalAmount * config.super_agent_commission_rate
            const fixedPortion = baseCommission * config.super_agent_fixed_rate
            const variablePortion = baseCommission * config.super_agent_variable_rate * (totalKPIScore / 100)

            commissionAmount = fixedPortion + variablePortion
          }

          calculationDetails = {
            type: 'super_agent',
            baseRate: config.super_agent_commission_rate,
            fixedRate: config.super_agent_fixed_rate,
            variableRate: config.super_agent_variable_rate,
            servedAgents: servedAgentCount,
            kpiScores: {
              activeness: activenessScore,
              valueTransacted: valueScore,
              uniqueAgents: uniqueAgentsScore,
              total: totalKPIScore
            },
            transactionCount,
            totalAmount,
            commissionAmount
          }
        } else if (agent.type === 'franchise') {
          // Franchise: commission based on agent performance
          const franchiseAgents = db
            .prepare(
              `
            SELECT COUNT(*) as count FROM agents
            WHERE parent_agent_id = ? AND is_active = 1
          `
            )
            .get(agent.id) as any

          const agentCount = franchiseAgents?.count || 0

          // Calculate expected turnover (agent value × multiplier)
          const expectedTurnover = totalAmount * config.franchise_multiplier

          // Simplified payband calculation (can be enhanced)
          let payband = 1.0
          const actualVsExpected = totalAmount / expectedTurnover

          if (actualVsExpected >= 1.0) payband = 1.0
          else if (actualVsExpected >= 0.8) payband = 0.8
          else if (actualVsExpected >= 0.6) payband = 0.6
          else if (actualVsExpected >= 0.4) payband = 0.4
          else payband = 0.2

          commissionAmount = totalAmount * config.commission_rate * payband

          calculationDetails = {
            type: 'franchise',
            multiplier: config.franchise_multiplier,
            expectedTurnover,
            actualTurnover: totalAmount,
            performanceRatio: actualVsExpected,
            payband,
            agentCount,
            commissionAmount
          }
        }

        // Save calculation to database
        const insertQuery = `
          INSERT OR REPLACE INTO commission_calculations
          (agent_id, agent_name, agent_type, period, total_amount, transaction_count,
           eligible_amount, commission_rate, commission_amount, payband, final_commission)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

        db.prepare(insertQuery).run(
          agent.id,
          agent.name,
          agent.type,
          period,
          totalAmount,
          transactionCount,
          totalAmount, // eligible_amount
          config.commission_rate,
          commissionAmount,
          1.0, // payband (can be enhanced)
          commissionAmount
        )

        calculations.push({
          agent: {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            accountNumber: agent.account_number
          },
          period,
          transactionCount,
          totalAmount,
          commissionAmount,
          calculationDetails
        })
      }

      // Get summary statistics
      const summary = db
        .prepare(
          `
        SELECT
          COUNT(*) as total_calculations,
          SUM(final_commission) as total_commission,
          AVG(final_commission) as avg_commission,
          MAX(final_commission) as max_commission
        FROM commission_calculations
        WHERE period = ?
      `
        )
        .get(period) as any

      res.status(200).json({
        success: true,
        message: `Calculated commissions for ${calculations.length} agents`,
        data: {
          period,
          config: {
            id: config.id,
            title: config.title,
            code: config.code
          },
          calculations,
          summary: {
            totalCalculations: summary?.total_calculations || 0,
            totalCommission: summary?.total_commission || 0,
            avgCommission: summary?.avg_commission || 0,
            maxCommission: summary?.max_commission || 0
          }
        }
      })
    } else {
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Commission calculation API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
