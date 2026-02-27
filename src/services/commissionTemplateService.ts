import Database from 'better-sqlite3'

export interface CommissionTemplate {
  id: number
  title: string
  code: string
  description: string
  calculation_type: string
  commission_rate: number
  agent_type: string
  status: string
  qualifying_threshold: number
  super_agent_commission_rate: number
  super_agent_fixed_rate: number
  super_agent_variable_rate: number
  franchise_multiplier: number
  kpi_weights: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CalculationProgress {
  totalAgents: number
  processedAgents: number
  currentAgent: string
  stage: string
  percentage: number
}

export interface CalculationResult {
  agent: any
  period: string
  transactionCount: number
  totalAmount: number
  commissionAmount: number
  calculationDetails: any
  template: CommissionTemplate
}

export class CommissionTemplateService {
  private db: Database.Database

  constructor() {
    this.db = new Database('agent360.db')
  }

  getActiveTemplate(): CommissionTemplate | null {
    const template = this.db
      .prepare(
        `
      SELECT * FROM commission_configs
      WHERE is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `
      )
      .get() as CommissionTemplate

    return template || null
  }

  getAllTemplates(): CommissionTemplate[] {
    return this.db
      .prepare(
        `
      SELECT * FROM commission_configs
      ORDER BY created_at DESC
    `
      )
      .all() as CommissionTemplate[]
  }

  calculateCommission(
    agent: any,
    period: string,
    template: CommissionTemplate,
    onProgress?: (progress: CalculationProgress) => void
  ): CalculationResult {
    const kpiWeights = template.kpi_weights
      ? JSON.parse(template.kpi_weights)
      : {
          activeness: 55,
          valueTransacted: 25,
          uniqueAgents: 20
        }

    let commissionAmount = 0
    let calculationDetails = {}

    // Get agent transactions for the period
    const transactions = this.db
      .prepare(
        `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE agent_id = ? AND strftime('%Y-%m', timestamp) = ? AND status = 'completed'
    `
      )
      .get(agent.id, agent.type) as any

    const transactionCount = transactions?.count || 0
    const totalAmount = transactions?.total_amount || 0

    if (agent.type === 'local_agent') {
      // Local agent: direct commission on transactions
      commissionAmount = totalAmount * template.commission_rate

      calculationDetails = {
        type: 'local_agent',
        baseRate: template.commission_rate,
        transactionCount,
        totalAmount,
        commissionAmount,
        qualifyingThreshold: template.qualifying_threshold,
        isQualified: totalAmount >= template.qualifying_threshold
      }
    } else if (agent.type === 'super_agent') {
      // Super agent: commission from agents they serve
      const servedAgents = this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM agents
        WHERE parent_agent_id = ? AND is_active = 1 AND type = 'local_agent'
      `
        )
        .get(agent.id) as any

      const servedAgentCount = servedAgents?.count || 0

      // Calculate KPI scores
      const activenessScore = transactionCount > 0 ? 100 : 0
      const valueScore =
        totalAmount > template.qualifying_threshold ? Math.min(totalAmount / template.qualifying_threshold, 100) : 0
      const uniqueAgentsScore = servedAgentCount > 0 ? Math.min((servedAgentCount / 10) * 100, 100) : 0

      const totalKPIScore =
        (activenessScore * kpiWeights.activeness) / 100 +
        (valueScore * kpiWeights.valueTransacted) / 100 +
        (uniqueAgentsScore * kpiWeights.uniqueAgents) / 100

      // Only get commission if KPI >= 50
      if (totalKPIScore >= 50) {
        const baseCommission = totalAmount * template.super_agent_commission_rate
        const fixedPortion = baseCommission * template.super_agent_fixed_rate
        const variablePortion = baseCommission * template.super_agent_variable_rate * (totalKPIScore / 100)

        commissionAmount = fixedPortion + variablePortion
      }

      calculationDetails = {
        type: 'super_agent',
        baseRate: template.super_agent_commission_rate,
        fixedRate: template.super_agent_fixed_rate,
        variableRate: template.super_agent_variable_rate,
        servedAgents: servedAgentCount,
        kpiScores: {
          activeness: activenessScore,
          valueTransacted: valueScore,
          uniqueAgents: uniqueAgentsScore,
          total: totalKPIScore
        },
        kpiWeights,
        transactionCount,
        totalAmount,
        commissionAmount,
        qualifyingThreshold: template.qualifying_threshold,
        isQualified: totalKPIScore >= 50
      }

      // Save KPI data
      this.db
        .prepare(
          `
        INSERT OR REPLACE INTO super_agent_kpis (
          super_agent_id, period, activeness_score, value_transacted_score,
          unique_agents_score, total_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          agent.id,
          period,
          activenessScore,
          valueScore,
          uniqueAgentsScore,
          totalKPIScore,
          new Date().toISOString(),
          new Date().toISOString()
        )
    } else if (agent.type === 'franchise') {
      // Franchise: commission based on agent performance
      const franchiseAgents = this.db
        .prepare(
          `
        SELECT COUNT(*) as count, COALESCE(SUM(t.amount), 0) as total_turnover
        FROM agents a
        LEFT JOIN transactions t ON a.id = t.agent_id
          AND strftime('%Y-%m', t.timestamp) = ?
          AND t.status = 'completed'
        WHERE a.parent_agent_id = ? AND a.is_active = 1
      `
        )
        .get(period, agent.id) as any

      const agentCount = franchiseAgents?.count || 0
      const totalTurnover = franchiseAgents?.total_turnover || 0

      // Get capital advanced for franchise agents (simplified - using average)
      const avgCA = 500000 // Average CA per agent
      const totalCA = agentCount * avgCA
      const expectedTurnover = totalCA * template.franchise_multiplier

      // Calculate payband
      let payband = 1.0
      const actualVsExpected = expectedTurnover > 0 ? totalTurnover / expectedTurnover : 0

      if (actualVsExpected >= 1.0) payband = 1.0 // Excellent - 100% payout
      else if (actualVsExpected >= 0.8) payband = 0.8 // Good - 80% payout
      else if (actualVsExpected >= 0.6) payband = 0.6 // Average - 60% payout
      else if (actualVsExpected >= 0.4) payband = 0.4 // Below Average - 40% payout
      else payband = 0.2 // Poor - 20% payout

      commissionAmount = totalTurnover * template.commission_rate * payband

      calculationDetails = {
        type: 'franchise',
        multiplier: template.franchise_multiplier,
        agentCount,
        totalCA,
        expectedTurnover,
        actualTurnover: totalTurnover,
        performanceRatio: actualVsExpected,
        payband,
        commissionAmount
      }

      // Save franchise calculation
      this.db
        .prepare(
          `
        INSERT OR REPLACE INTO franchise_calculations (
          franchise_id, period, agent_to_customer_value,
          expected_turnover, actual_turnover, payband,
          commission_rate, commission_amount, clawback_amount, final_commission,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          agent.id,
          period,
          totalCA,
          expectedTurnover,
          totalTurnover,
          payband,
          template.commission_rate,
          totalTurnover * template.commission_rate,
          totalTurnover * template.commission_rate - commissionAmount,
          commissionAmount,
          new Date().toISOString(),
          new Date().toISOString()
        )
    }

    // Save calculation to commission_calculations table
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO commission_calculations
      (agent_id, agent_name, agent_type, period, total_amount, transaction_count,
       eligible_amount, commission_rate, commission_amount, payband, final_commission,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        agent.id,
        agent.name,
        agent.type,
        period,
        totalAmount,
        transactionCount,
        totalAmount, // eligible_amount
        template.commission_rate,
        commissionAmount,
        calculationDetails.type === 'franchise' ? calculationDetails.payband : 1.0,
        commissionAmount,
        new Date().toISOString(),
        new Date().toISOString()
      )

    return {
      agent,
      period,
      transactionCount,
      totalAmount,
      commissionAmount,
      calculationDetails,
      template
    }
  }

  async calculateBatchCommissions(
    period: string,
    calculationType = 'all',
    agentIds: string[] = [],
    onProgress?: (progress: CalculationProgress) => void
  ): Promise<CalculationResult[]> {
    const template = this.getActiveTemplate()
    if (!template) {
      throw new Error('No active commission template found')
    }

    // Get agents to calculate
    let query = `
      SELECT a.*, COUNT(t.id) as transaction_count, COALESCE(SUM(t.amount), 0) as total_amount
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
        AND strftime('%Y-%m', t.timestamp) = ?
        AND t.status = 'completed'
        AND t.commission_eligible = 1
      WHERE a.is_active = 1 AND a.commission_eligible = 1
    `
    const params: any[] = [period]

    if (agentIds.length > 0) {
      query += ` AND a.id IN (${agentIds.map(() => '?').join(',')})`
      params.push(...agentIds)
    }

    if (calculationType !== 'all') {
      query += ` AND a.type = ?`
      params.push(calculationType)
    }

    query += ` GROUP BY a.id ORDER BY a.type, a.name`

    const agents = this.db.prepare(query).all(...params) as any[]
    const results: CalculationResult[] = []

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i]

      // Update progress
      if (onProgress) {
        onProgress({
          totalAgents: agents.length,
          processedAgents: i,
          currentAgent: agent.name,
          stage: 'Calculating commission',
          percentage: (i / agents.length) * 100
        })
      }

      const result = this.calculateCommission(agent, period, template, onProgress)
      results.push(result)
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        totalAgents: agents.length,
        processedAgents: agents.length,
        currentAgent: 'Completed',
        stage: 'Finalizing results',
        percentage: 100
      })
    }

    return results
  }

  close() {
    this.db.close()
  }
}
