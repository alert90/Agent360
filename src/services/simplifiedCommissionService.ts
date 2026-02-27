import Database from 'better-sqlite3'

export interface SimpleCommissionResult {
  agentId: number
  agentName: string
  agentType: string
  totalAmount: number
  transactionCount: number
  commissionRate: number
  commissionAmount: number
  period: string
}

export interface CommissionConfig {
  minTransactionAmount: number
  commissionRate: number
  superAgentCommissionRate: number
  franchiseMultiplier: number
}

export class SimplifiedCommissionService {
  private static db = new Database('agent360.db')

  static getDefaultConfig(): CommissionConfig {
    try {
      const config = this.db
        .prepare(
          `
        SELECT * FROM commission_configs
        WHERE status = 'active' AND agent_type = 'all'
        ORDER BY created_at DESC
        LIMIT 1
      `
        )
        .get() as any

      if (config) {
        return {
          minTransactionAmount: config.min_transaction_amount || 100000,
          commissionRate: config.commission_rate || 0.05,
          superAgentCommissionRate: config.super_agent_commission_rate || 0.2,
          franchiseMultiplier: config.franchise_multiplier || 4.5
        }
      }
    } catch (error) {
      console.error('Error fetching commission config:', error)
    }

    // Fallback defaults
    return {
      minTransactionAmount: 100000,
      commissionRate: 0.05,
      superAgentCommissionRate: 0.2,
      franchiseMultiplier: 4.5
    }
  }

  static calculateCommissionForPeriod(period: string): SimpleCommissionResult[] {
    const config = this.getDefaultConfig()
    const results: SimpleCommissionResult[] = []

    try {
      // Get all agents with their transactions for the period
      const agentsQuery = `
        SELECT
          a.id,
          a.name,
          a.type,
          a.parent_agent_id,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COALESCE(COUNT(t.id), 0) as transaction_count
        FROM agents a
        LEFT JOIN transactions t ON a.id = t.agent_id
          AND t.status = 'completed'
          AND substr(t.timestamp, 1, 7) = ?
        WHERE a.is_active = 1
        GROUP BY a.id, a.name, a.type, a.parent_agent_id
      `

      let agents = this.db.prepare(agentsQuery).all(period) as any[]

      // If no transactions found for the period, try using created_at instead
      if (agents.every(agent => agent.total_amount === 0)) {
        const agentsQueryWithCreatedAt = `
          SELECT
            a.id,
            a.name,
            a.type,
            a.parent_agent_id,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COALESCE(COUNT(t.id), 0) as transaction_count
          FROM agents a
          LEFT JOIN transactions t ON a.id = t.agent_id
            AND t.status = 'completed'
            AND substr(t.created_at, 1, 7) = ?
          WHERE a.is_active = 1
          GROUP BY a.id, a.name, a.type, a.parent_agent_id
        `
        agents = this.db.prepare(agentsQueryWithCreatedAt).all(period) as any[]
      }

      agents.forEach(agent => {
        let commissionRate = config.commissionRate
        let commissionAmount = 0

        if (agent.type === 'local_agent') {
          // Local agents: 5% of transactions >= 100,000
          const eligibleAmount = Math.max(0, agent.total_amount - config.minTransactionAmount)
          commissionAmount = eligibleAmount * commissionRate
        } else if (agent.type === 'super_agent') {
          // Super agents: 20% of commissions from assigned local agents
          const assignedLocalAgentsQuery = `
            SELECT COALESCE(SUM(t.amount), 0) as total_amount
            FROM agents la
            JOIN agent_assignments aa ON la.id = aa.local_agent_id
            LEFT JOIN transactions t ON la.id = t.agent_id
              AND t.status = 'completed'
              AND substr(t.timestamp, 1, 7) = ?
            WHERE aa.super_agent_id = ?
              AND aa.status = 'active'
              AND la.is_active = 1
          `

          const assignedResult = this.db.prepare(assignedLocalAgentsQuery).get(period, agent.id) as any
          const assignedTotalAmount = assignedResult?.total_amount || 0
          const eligibleAssignedAmount = Math.max(0, assignedTotalAmount - config.minTransactionAmount)
          const assignedCommission = eligibleAssignedAmount * config.commissionRate
          commissionAmount = assignedCommission * config.superAgentCommissionRate
          commissionRate = config.superAgentCommissionRate
        } else if (agent.type === 'franchise') {
          // Franchises: 4.5x multiplier on assigned local agents' transactions
          const assignedLocalAgentsQuery = `
            SELECT COALESCE(SUM(t.amount), 0) as total_amount
            FROM agents la
            JOIN agent_assignments aa ON la.id = aa.local_agent_id
            LEFT JOIN transactions t ON la.id = t.agent_id
              AND t.status = 'completed'
              AND substr(t.timestamp, 1, 7) = ?
            WHERE aa.franchise_id = ?
              AND aa.status = 'active'
              AND la.is_active = 1
          `

          const assignedResult = this.db.prepare(assignedLocalAgentsQuery).get(period, agent.id) as any
          const assignedTotalAmount = assignedResult?.total_amount || 0
          const eligibleAssignedAmount = Math.max(0, assignedTotalAmount - config.minTransactionAmount)
          const baseCommission = eligibleAssignedAmount * config.commissionRate
          commissionAmount = baseCommission * config.franchiseMultiplier
          commissionRate = config.commissionRate * config.franchiseMultiplier
        }

        results.push({
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          totalAmount: agent.total_amount,
          transactionCount: agent.transaction_count,
          commissionRate,
          commissionAmount,
          period
        })
      })

      return results
    } catch (error) {
      console.error('Error calculating commissions:', error)

      return []
    }
  }

  static saveCommissionCalculations(period: string): boolean {
    try {
      const results = this.calculateCommissionForPeriod(period)

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO commission_calculations (
          agent_id, agent_name, agent_type, period, total_amount,
          transaction_count, eligible_amount, commission_rate,
          commission_amount, payband, final_commission
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = this.db.transaction(() => {
        results.forEach(result => {
          insertStmt.run(
            result.agentId,
            result.agentName,
            result.agentType,
            result.period,
            result.totalAmount,
            result.transactionCount,
            Math.max(0, result.totalAmount - this.getDefaultConfig().minTransactionAmount),
            result.commissionRate,
            result.commissionAmount,
            1.0, // Default payband
            result.commissionAmount
          )
        })
      })

      transaction()

      return true
    } catch (error) {
      console.error('Error saving commission calculations:', error)

      return false
    }
  }

  static getCommissionReport(period: string): SimpleCommissionResult[] {
    try {
      const query = `
        SELECT
          agent_id,
          agent_name,
          agent_type,
          total_amount,
          transaction_count,
          commission_rate,
          final_commission as commission_amount,
          period
        FROM commission_calculations
        WHERE period = ?
        ORDER BY final_commission DESC
      `

      const results = this.db.prepare(query).all(period) as any[]

      return results.map(row => ({
        agentId: row.agent_id,
        agentName: row.agent_name,
        agentType: row.agent_type,
        totalAmount: row.total_amount,
        transactionCount: row.transaction_count,
        commissionRate: row.commission_rate,
        commissionAmount: row.commission_amount,
        period: row.period
      }))
    } catch (error) {
      console.error('Error fetching commission report:', error)

      return []
    }
  }
}
