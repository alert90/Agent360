import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const {
      period = 'current_month' // current_month, last_month, last_two_months, etc.
    } = req.query

    // Get active commission configuration
    const config = db
      .prepare(
        `
      SELECT * FROM commission_configs
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `
      )
      .get() as any

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No active commission configuration found'
      })
    }

    // Parse KPI weights from config
    const kpiWeights = config.kpi_weights
      ? JSON.parse(config.kpi_weights)
      : {
          activeness: 55,
          valueTransacted: 25,
          uniqueAgents: 20
        }

    // Calculate date range for the period
    const now = new Date()
    let startDate: Date
    let endDate: Date
    let periodLabel: string

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        periodLabel = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
        break
      case 'last_two_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0)
        periodLabel = `${now.getFullYear()}-${String(now.getMonth() - 1).padStart(2, '0')}`
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        break
    }

    let whereClause = 'WHERE t.timestamp >= ? AND t.timestamp < ? AND t.status = "completed"'
    const params: any[] = [startDate.toISOString(), endDate.toISOString()]

    // Apply role-based filtering
    if (user.role === 'agent') {
      whereClause += ' AND t.agent_id = ?'
      params.push(user.id)
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      // Get agents under this user
      const userAgents = db.prepare('SELECT id FROM agents WHERE parent_agent_id = ?').all(user.id) as any[]
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id)
        whereClause += ` AND t.agent_id IN (${agentIds.join(',')})`
      } else {
        whereClause += ' AND 1=0' // No agents under this user
      }
    }

    // Get all agents for commission calculation
    const agentsQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.type,
        a.parent_agent_id
      FROM agents a
      WHERE a.is_active = 1
      ${user.role === 'agent' ? 'AND a.id = ?' : ''}
      ${user.role === 'super_agent' || user.role === 'franchise' ? `AND a.parent_agent_id = ?` : ''}
    `

    const agentsParams: any[] = []
    if (user.role === 'agent') {
      agentsParams.push(user.id)
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      agentsParams.push(user.id)
    }

    const agents = db.prepare(agentsQuery).all(...agentsParams) as any[]

    const commissionCalculations = []

    for (const agent of agents) {
      // Get agent's transactions for the period
      const transactionsQuery = `
        SELECT
          COUNT(*) as transaction_count,
          SUM(t.amount) as total_amount,
          SUM(t.commission_amount) as current_commission
        FROM transactions t
        ${whereClause}
        AND t.agent_id = ?
      `

      const agentTransactions = db.prepare(transactionsQuery).get(...params, agent.id) as any

      const transactionCount = agentTransactions?.transaction_count || 0
      const totalAmount = agentTransactions?.total_amount || 0

      let commissionAmount = 0
      let calculationDetails = {}

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

        // Simplified payband calculation
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

      commissionCalculations.push({
        agent: {
          id: agent.id,
          name: agent.name,
          accountNumber: agent.account_number,
          type: agent.type,
          parentAgentId: agent.parent_agent_id
        },
        period: periodLabel,
        transactionCount,
        totalAmount,
        commissionAmount,
        calculationDetails,
        eligible: commissionAmount > 0
      })
    }

    // Calculate summary statistics
    const summary = {
      totalAgents: commissionCalculations.length,
      eligibleAgents: commissionCalculations.filter(c => c.eligible).length,
      totalCommission: commissionCalculations.reduce((sum, c) => sum + c.commissionAmount, 0),
      byType: {
        super_agents: {
          count: commissionCalculations.filter(c => c.agent.type === 'super_agent').length,
          totalCommission: commissionCalculations
            .filter(c => c.agent.type === 'super_agent')
            .reduce((sum, c) => sum + c.commissionAmount, 0)
        },
        franchises: {
          count: commissionCalculations.filter(c => c.agent.type === 'franchise').length,
          totalCommission: commissionCalculations
            .filter(c => c.agent.type === 'franchise')
            .reduce((sum, c) => sum + c.commissionAmount, 0)
        },
        local_agents: {
          count: commissionCalculations.filter(c => c.agent.type === 'local_agent').length,
          totalCommission: commissionCalculations
            .filter(c => c.agent.type === 'local_agent')
            .reduce((sum, c) => sum + c.commissionAmount, 0)
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        period: periodLabel,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        config: {
          id: config.id,
          title: config.title,
          code: config.code,
          commissionRate: config.commission_rate,
          kpiWeights
        },
        calculations: commissionCalculations,
        summary
      }
    })
  } catch (error) {
    console.error('Commission reports API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate commission reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
