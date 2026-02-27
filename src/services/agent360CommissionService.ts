import Database from 'better-sqlite3'

export interface Agent360CommissionResult {
  agentId: number
  agentName: string
  agentType: string
  period: string

  // Common fields
  totalAmount: number
  transactionCount: number
  commissionAmount: number

  // Super Agent specific fields

  fixedCommission?: number
  variableCommission?: number
  kpiScores?: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
    total: number
    band: number
  }

  // Franchise specific fields
  capitalAdvanced?: number
  performancePercentage?: number
  paybandLevel?: string
  apportionRate?: number
  clawbackAmount?: number
}

export interface CommissionConfig {
  minTransactionAmount: number
  commissionRate: number
  superAgentCommissionRate: number
  superAgentFixedRate: number
  superAgentVariableRate: number
  franchiseMultiplier: number
  kpiWeights: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }
}

export class Agent360CommissionService {
  private static db = new Database('agent360.db')

  // KPI Band mappings as per Agent360.pdf
  private static readonly KPI_BANDS = [
    { min: 0, max: 50, rate: 0 },
    { min: 51, max: 60, rate: 20 },
    { min: 61, max: 70, rate: 40 },
    { min: 71, max: 80, rate: 60 },
    { min: 81, max: 90, rate: 80 },
    { min: 91, max: 100, rate: 100 }
  ]

  // Franchise Payband structure as per Agent360.pdf
  private static readonly FRANCHISE_PAYBANDS = [
    { min: 0, max: 39, level: 'Poor', apportionRate: 0.28 },
    { min: 40, max: 59, level: 'Below Average', apportionRate: 0.46 },
    { min: 60, max: 79, level: 'Average', apportionRate: 0.64 },
    { min: 80, max: 99, level: 'Good', apportionRate: 0.82 },
    { min: 100, max: Infinity, level: 'Excellent', apportionRate: 1.0 }
  ]

  static getDefaultConfig(): CommissionConfig {
    try {
      const config = this.db
        .prepare(
          `SELECT * FROM commission_configs
           WHERE status = 'active' AND agent_type = 'all'
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .get() as any

      if (config) {
        let kpiWeights = { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }
        if (config.kpi_weights) {
          try {
            kpiWeights = JSON.parse(config.kpi_weights)
          } catch (e) {
            console.warn('Invalid KPI weights JSON, using defaults')
          }
        }

        return {
          minTransactionAmount: config.min_transaction_amount || 100000,
          commissionRate: config.commission_rate || 0.05,
          superAgentCommissionRate: config.super_agent_commission_rate || 0.2,
          superAgentFixedRate: config.super_agent_fixed_rate || 0.3,
          superAgentVariableRate: config.super_agent_variable_rate || 0.7,
          franchiseMultiplier: config.franchise_multiplier || 4.5,
          kpiWeights
        }
      }
    } catch (error) {
      console.error('Error fetching commission config:', error)
    }

    // Fallback defaults matching Agent360.pdf
    return {
      minTransactionAmount: 100000,
      commissionRate: 0.05,
      superAgentCommissionRate: 0.2,
      superAgentFixedRate: 0.3,
      superAgentVariableRate: 0.7,
      franchiseMultiplier: 4.5,
      kpiWeights: {
        activeness: 55,
        valueTransacted: 20,
        uniqueAgents: 25
      }
    }
  }

  static getKPIBand(score: number): number {
    const band = this.KPI_BANDS.find(b => score >= b.min && score <= b.max)
    return band?.rate || 0
  }

  static getFranchisePayband(performancePercentage: number): { level: string; apportionRate: number } {
    const payband = this.FRANCHISE_PAYBANDS.find(b => performancePercentage >= b.min && performancePercentage <= b.max)
    return payband || { level: 'Poor', apportionRate: 0.28 }
  }

  static calculateAllCommissions(period: string): Agent360CommissionResult[] {
    const config = this.getDefaultConfig()
    const results: Agent360CommissionResult[] = []

    try {
      // Get all agents
      const agentsQuery = `SELECT id, name, type, is_active FROM agents WHERE is_active = 1`
      const agents = this.db.prepare(agentsQuery).all() as any[]

      agents.forEach(agent => {
        let result: Agent360CommissionResult | null = null

        if (agent.type === 'local_agent') {
          result = this.calculateLocalAgentCommission(agent.id, agent.name, period, config)
        } else if (agent.type === 'super_agent') {
          result = this.calculateSuperAgentCommission(agent.id, agent.name, period, config)
        } else if (agent.type === 'franchise') {
          result = this.calculateFranchiseCommission(agent.id, agent.name, period, config)
        }

        if (result) {
          results.push(result)
        }
      })

      return results
    } catch (error) {
      console.error('Error calculating all commissions:', error)
      return []
    }
  }

  static calculateLocalAgentCommission(
    agentId: number,
    agentName: string,
    period: string,
    config: CommissionConfig
  ): Agent360CommissionResult {
    const agentQuery = `
      SELECT COALESCE(SUM(t.amount), 0) as total_amount,
             COALESCE(COUNT(t.id), 0) as transaction_count
      FROM transactions t
      WHERE t.agent_id = ? AND t.status = 'completed'
        AND substr(t.timestamp, 1, 7) = ?
    `

    const agentData = this.db.prepare(agentQuery).get(agentId, period) as any
    const totalAmount = agentData?.total_amount || 0
    const transactionCount = agentData?.transaction_count || 0

    // Only calculate commission if above minimum threshold
    let commissionAmount = 0
    if (totalAmount >= config.minTransactionAmount) {
      commissionAmount = (totalAmount - config.minTransactionAmount) * config.commissionRate
    }

    return {
      agentId,
      agentName,
      agentType: 'local_agent',
      period,
      totalAmount,
      transactionCount,
      commissionAmount
    }
  }

  static calculateSuperAgentCommission(
    superAgentId: number,
    superAgentName: string,
    period: string,
    config: CommissionConfig
  ): Agent360CommissionResult {
    // Get assigned local agents and their transactions
    const assignedAgentsQuery = `
      SELECT la.id, la.name, la.is_active,
             COALESCE(SUM(t.amount), 0) as total_amount,
             COALESCE(COUNT(t.id), 0) as transaction_count
      FROM agents la
      JOIN agent_assignments aa ON la.id = aa.local_agent_id
      LEFT JOIN transactions t ON la.id = t.agent_id
        AND t.status = 'completed'
        AND substr(t.timestamp, 1, 7) = ?
      WHERE aa.super_agent_id = ? AND aa.status = 'active' AND la.is_active = 1
      GROUP BY la.id, la.name, la.is_active
    `

    const assignedAgents = this.db.prepare(assignedAgentsQuery).all(period, superAgentId) as any[]
    const qualifyingAgents = assignedAgents.filter(agent => agent.total_amount >= config.minTransactionAmount)

    // Calculate total eligible commission from qualifying agents
    const totalAgentCommission = qualifyingAgents.reduce((sum, agent) => {
      return sum + (agent.total_amount * config.commissionRate)
    }, 0)

    // Super Agent gets 20% of total qualifying agent commissions
    const totalEligibleCommission = totalAgentCommission * config.superAgentCommissionRate

    // Split into fixed (30%) and variable (70%)
    const fixedCommission = totalEligibleCommission * config.superAgentFixedRate
    const variableCommissionBase = totalEligibleCommission * config
import Database from 'better-sqlite3'

export interface Agent360CommissionResult {
  agentId: number
  agentName: string
  agentType: string
  period: string

  // Common fields
  totalAmount: number
  transactionCount: number
  commissionAmount: number

  // Super Agent specific fields

  fixedCommission?: number
  variableCommission?: number
  kpiScores?: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
    total: number
    band: number
  }

  // Franchise specific fields
  capitalAdvanced?: number
  performancePercentage?: number
  paybandLevel?: string
  apportionRate?: number
  clawbackAmount?: number
}

export interface CommissionConfig {
  minTransactionAmount: number
  commissionRate: number
  superAgentCommissionRate: number
  superAgentFixedRate: number
  superAgentVariableRate: number
  franchiseMultiplier: number
  kpiWeights: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }
}

export class Agent360CommissionService {
  private static db = new Database('agent360.db')

  // KPI Band mappings as per Agent360.pdf
  private static readonly KPI_BANDS = [
    { min: 0, max: 50, rate: 0 },
    { min: 51, max: 60, rate: 20 },
    { min: 61, max: 70, rate: 40 },
    { min: 71, max: 80, rate: 60 },
    { min: 81, max: 90, rate: 80 },
    { min: 91, max: 100, rate: 100 }
  ]

  // Franchise Payband structure as per Agent360.pdf
}
