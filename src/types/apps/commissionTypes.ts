// src/types/apps/commissionTypes.ts (updates)
export interface CommissionConfig {
  id: number
  title: string
  code: string
  description: string | null
  type: 'SUPER_AGENT' | 'FRANCHISE'
  value: number
  agentType: string
  status: string

  // Local Agent Settings
  minTransactionAmount: number | null
  commissionRate: number | null

  // Super Agent Settings
  superAgentCommissionRate: number | null
  superAgentFixedRate: number | null
  superAgentVariableRate: number | null

  // KPI Weights
  kpiWeights: string | null // JSON string

  // Franchise Settings
  franchiseMultiplier: number | null
  franchiseBaseRate: number | null

  // Payband Configuration (JSON string)
  paybandRates: string | null

  // Common
  isActive: number
  createdAt: Date
  updatedAt: Date
}

// These match the return types from the calculator classes
export interface SuperAgentKPIResult {
  totalAgents: number
  activeAgents: number
  activenessScore: number
  valueTransactedScore: number
  uniqueAgentsScore: number
  totalScore: number
  kpiBand: number
  fixedCommission: number
  variableCommission: number
}

export interface FranchisePerformanceResult {
  totalCapitalAdvanced: number
  expectedTurnover: number
  actualTurnover: number
  performancePercentage: number
  paybandLevel: string
  apportionRate: number
  clawbackAmount: number
}
