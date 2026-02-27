import {
  Agent,
  CommissionCalculation,
  SuperAgentKPI,
  FranchiseCalculation,
  PAYBANDS,
  AgentType,
  CommissionConfig
} from '../types/apps/commissionTypes'
import { TransactionType } from '../types/apps/transactionsTypes'

export class CommissionCalculationService {
  // Agent classification constants based on user requirements
  private static readonly AGENT_PREFIX = '01J7'
  private static readonly EXPECTED_SUPER_AGENTS = 25
  private static readonly EXPECTED_FRANCHISES = 200
  private static readonly MIN_COMMISSION_AMOUNT = 100000

  // Agent hierarchy mapping based on branch codes
  private static readonly SUPER_AGENT_BRANCHES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
  ]
  private static readonly FRANCHISE_BRANCHES = Array.from({ length: 200 }, (_, i) => i + 26) // 26-225

  // Commission rates
  private static readonly LOCAL_AGENT_COMMISSION_RATE = 0.05 // 5%
  private static readonly SUPER_AGENT_TOTAL_RATE = 0.2 // 20% of served agents' commissions
  private static readonly SUPER_AGENT_FIXED_RATE = 0.3 // 30% of 20% = 6%
  private static readonly SUPER_AGENT_VARIABLE_RATE = 0.7 // 70% of 20% = 14%
  private static readonly FRANCHISE_MULTIPLIER = 4.5 // Expected turnover multiplier

  static determineAgentType(agentAccount: string, agentName = '', branchCode = ''): AgentType {
    // First check if it's a valid Agent Account
    if (!agentAccount?.startsWith(this.AGENT_PREFIX)) {
      return 'local_agent' // Default fallback
    }

    // Use branch code for classification
    const branchCodeNum = parseInt(branchCode || '0')

    // Super agents: branch codes 1-25
    if (this.SUPER_AGENT_BRANCHES.includes(branchCodeNum)) {
      return 'super_agent'
    }

    // Franchises: branch codes 26-225
    if (this.FRANCHISE_BRANCHES.includes(branchCodeNum)) {
      return 'franchise'
    }

    // Default to local agent
    return 'local_agent'
  }

  static groupTransactionsByAgent(transactions: TransactionType[]): Map<string, TransactionType[]> {
    const agentGroups = new Map<string, TransactionType[]>()

    transactions.forEach(transaction => {
      if (!agentGroups.has(transaction.agentId)) {
        agentGroups.set(transaction.agentId, [])
      }
      agentGroups.get(transaction.agentId)!.push(transaction)
    })

    return agentGroups
  }

  static calculateAgentCommission(
    agentId: string,
    agentName: string,
    transactions: TransactionType[],
    config: CommissionConfig,
    period: string
  ): CommissionCalculation {
    const eligibleTransactions = transactions.filter(
      t => t.commissionEligible && t.amount >= this.MIN_COMMISSION_AMOUNT
    )
    const totalAmount = eligibleTransactions.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = eligibleTransactions.length

    // Local agents get direct commission from customer transactions
    // Commission rate: 5% for transactions >= 100,000
    let commissionRate = 0.05 // Default 5%
    if (totalAmount >= 1000000) {
      commissionRate = 0.06 // 6% for transactions above 1M
    } else if (totalAmount >= 500000) {
      commissionRate = 0.055 // 5.5% for transactions above 500K
    }

    const commissionAmount = totalAmount * commissionRate
    const payband = this.calculatePayband(totalAmount, totalAmount * 1.2) // Simple payband calculation
    const finalCommission = commissionAmount * payband

    return {
      agentId,
      agentName,
      agentType: this.determineAgentType(agentId, agentName),
      totalAmount,
      transactionCount,
      eligibleAmount: totalAmount,
      commissionRate,
      commissionAmount,
      payband,
      finalCommission,
      period
    }
  }

  static calculateSuperAgentCommission(
    superAgentId: string,
    superAgentName: string,
    servedAgents: Agent[],
    config: CommissionConfig,
    period: string
  ): CommissionCalculation {
    const totalServedCommission = servedAgents.reduce((sum, agent) => sum + agent.commissionAmount, 0)
    const totalServedAmount = servedAgents.reduce((sum, agent) => sum + agent.totalTransactionAmount, 0)

    // Super agent gets 20% of total commission from served agents
    const superAgentCommissionRate = config.superAgentCommissionRate // 20%
    const totalCommission = totalServedCommission * superAgentCommissionRate

    // Split into fixed (30%) and variable (70%)
    const fixedCommission = totalCommission * config.superAgentFixedRate // 6%
    const variableCommission = totalCommission * config.superAgentVariableRate // 14%

    // Calculate KPI scores
    const kpi = this.calculateSuperAgentKPI(servedAgents, config)

    // Apply KPI weights to variable commission
    const weightedVariableCommission = variableCommission * (kpi.totalScore / 100)
    const finalCommission = fixedCommission + weightedVariableCommission

    return {
      agentId: superAgentId,
      agentName: superAgentName,
      agentType: 'super_agent',
      totalAmount: totalServedAmount,
      transactionCount: servedAgents.reduce((sum, agent) => sum + agent.transactionCount, 0),
      eligibleAmount: totalServedAmount,
      commissionRate: superAgentCommissionRate,
      commissionAmount: finalCommission,
      payband: kpi.totalScore / 100, // Use KPI score as payband
      finalCommission,
      period
    }
  }

  static calculateSuperAgentKPI(servedAgents: Agent[], config: CommissionConfig): SuperAgentKPI {
    const { kpiWeights } = config

    // Activeness: Based on percentage of active agents
    const activeAgents = servedAgents.filter(agent => agent.isActive).length
    const activenessScore = servedAgents.length > 0 ? (activeAgents / servedAgents.length) * 100 : 0

    // Value transacted: Based on total transaction value
    const totalValue = servedAgents.reduce((sum, agent) => sum + agent.totalTransactionAmount, 0)
    const averageValue = servedAgents.length > 0 ? totalValue / servedAgents.length : 0
    const valueTransactedScore = Math.min((averageValue / 1000000) * 100, 100) // Normalize to 1M baseline

    // Unique agents: Based on number of unique agents served
    const uniqueAgentsScore = Math.min((servedAgents.length / 50) * 100, 100) // Normalize to 50 agents baseline

    // Calculate weighted scores
    const weightedActiveness = activenessScore * (kpiWeights.activeness / 100)
    const weightedValueTransacted = valueTransactedScore * (kpiWeights.valueTransacted / 100)
    const weightedUniqueAgents = uniqueAgentsScore * (kpiWeights.uniqueAgents / 100)

    const totalScore = weightedActiveness + weightedValueTransacted + weightedUniqueAgents

    return {
      activenessWeight: kpiWeights.activeness,
      valueTransactedWeight: kpiWeights.valueTransacted,
      uniqueAgentsWeight: kpiWeights.uniqueAgents,
      activenessScore,
      valueTransactedScore,
      uniqueAgentsScore,
      totalScore
    }
  }

  static calculateFranchiseCommission(
    franchiseId: string,
    franchiseName: string,
    servedAgents: Agent[],
    config: CommissionConfig,
    period: string
  ): FranchiseCalculation {
    // Calculate agent to customer value (total transactions by served agents)
    const agentToCustomerValue = servedAgents.reduce((sum, agent) => sum + agent.totalTransactionAmount, 0)

    // Expected turnover with 4.5x multiplier
    const expectedTurnover = agentToCustomerValue * config.franchiseMultiplier

    // For this example, we'll use actual turnover as AgentToCustomerValue
    // In real scenario, this would be the actual revenue generated
    const actualTurnover = agentToCustomerValue

    // Calculate payband based on performance
    const performancePercentage = expectedTurnover > 0 ? (actualTurnover / expectedTurnover) * 100 : 0
    const payband = this.getPaybandMultiplier(performancePercentage)

    // Commission calculation (5% base rate)
    const commissionRate = 0.05
    const commissionAmount = actualTurnover * commissionRate
    const finalCommission = commissionAmount * payband

    // Calculate clawback (20% of commission if performance is below 100%)
    const clawbackAmount = performancePercentage < 100 ? finalCommission * 0.2 : 0

    return {
      franchiseId,
      franchiseName,
      agentToCustomerValue,
      expectedTurnover,
      actualTurnover,
      payband,
      commissionRate,
      commissionAmount,
      clawbackAmount,
      finalCommission: finalCommission - clawbackAmount
    }
  }

  static calculatePayband(actual: number, expected: number): number {
    const percentage = expected > 0 ? (actual / expected) * 100 : 0

    return this.getPaybandMultiplier(percentage)
  }

  static getPaybandMultiplier(percentage: number): number {
    const payband = PAYBANDS.find(pb => percentage >= pb.minPercentage && percentage <= pb.maxPercentage)

    return payband?.multiplier || 0.2
  }

  static createAgentFromTransaction(
    agentId: string,
    agentName: string,
    transactions: TransactionType[],
    parentAgentId?: string
  ): Agent {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = transactions.length
    const commissionAmount = totalAmount * 0.05 // Basic commission calculation

    return {
      id: agentId,
      name: agentName,
      accountNumber: agentId,
      type: this.determineAgentType(agentId, agentName, transactions[0]?.branchCode),
      branchCode: transactions[0]?.branchCode || 'UNKNOWN',
      branchName: transactions[0]?.location || 'Unknown',
      parentAgentId,
      isActive: transactionCount > 0,
      totalTransactionAmount: totalAmount,
      transactionCount,
      commissionAmount,
      payband: 1.0
    }
  }

  static processCommissionCalculations(
    transactions: TransactionType[],
    config: CommissionConfig,
    period: string
  ): {
    agents: Agent[]
    agentCalculations: CommissionCalculation[]
    superAgentCalculations: CommissionCalculation[]
    franchiseCalculations: FranchiseCalculation[]
  } {
    // Group transactions by agent
    const AgentGroups = this.groupTransactionsByAgent(transactions)

    // Create agents from transactions
    const agents: Agent[] = Array.from(AgentGroups.entries()).map(([agentId, agentTransactions]) => {
      const agentName = agentTransactions[0]?.agentName || `Agent ${agentId}`

      return this.createAgentFromTransaction(agentId, agentName, agentTransactions)
    })

    // Separate agents by type
    const localAgents = agents.filter(agent => agent.type === 'local_agent')
    const superAgents = agents.filter(agent => agent.type === 'super_agent')
    const franchises = agents.filter(agent => agent.type === 'franchise')

    // Calculate commissions for local agents
    const agentCalculations: CommissionCalculation[] = localAgents.map(agent => {
      const agentTransactions = AgentGroups.get(agent.id) || []

      return this.calculateAgentCommission(agent.id, agent.name, agentTransactions, config, period)
    })

    // Calculate super agent commissions
    const superAgentCalculations: CommissionCalculation[] = superAgents.map(superAgent => {
      // Find agents served by this super agent (simplified logic - same branch)
      const servedAgents = localAgents.filter(agent => agent.branchCode === superAgent.branchCode)

      return this.calculateSuperAgentCommission(superAgent.id, superAgent.name, servedAgents, config, period)
    })

    // Calculate franchise commissions
    const franchiseCalculations: FranchiseCalculation[] = franchises.map(franchise => {
      // Find agents served by this franchise (simplified logic - same branch)
      const servedAgents = localAgents.filter(agent => agent.branchCode === franchise.branchCode)

      return this.calculateFranchiseCommission(franchise.id, franchise.name, servedAgents, config, period)
    })

    return {
      agents,
      agentCalculations,
      superAgentCalculations,
      franchiseCalculations
    }
  }

  static getDefaultConfig(): CommissionConfig {
    return {
      id: 'default-config',
      title: 'Default Commission Configuration',
      code: 'DEFAULT',
      description: 'Standard commission calculation rules',
      type: 'percentage',
      value: 5,
      agentType: 'all',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      minTransactionAmount: this.MIN_COMMISSION_AMOUNT,
      commissionRate: 0.05,
      paybandFee: 0,
      superAgentCommissionRate: 0.2,
      superAgentFixedRate: 0.3,
      superAgentVariableRate: 0.7,
      franchiseMultiplier: 4.5,
      kpiWeights: {
        activeness: 55,
        valueTransacted: 25,
        uniqueAgents: 20
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
}
