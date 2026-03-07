export interface CommissionConfig {
  id: number
  title: string
  code: string
  description: string | null
  type: string
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
  kpiWeights: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }

  // Franchise Settings
  franchiseMultiplier: number | null
  franchiseBaseRate: number | null

  // Payband Configuration
  paybandRates: {
    excellent: { min: number; rate: number }
    good: { min: number; max: number; rate: number }
    average: { min: number; max: number; rate: number }
    belowAverage: { min: number; max: number; rate: number }
    poor: { max: number; rate: number }
  }

  // Common
  isActive: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CommissionCalculation {
  agentId: number
  agentName: string
  agentType: string
  period: string
  transactionCount: number
  totalAmount: number
  eligibleAmount: number
  commissionRate: number
  commissionAmount: number
  payband: number
  finalCommission: number

  // Super Agent specific
  kpiScores?: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
    total: number
  }

  // Franchise specific
  capitalAdvanced?: number
  expectedTurnover?: number
  actualTurnover?: number
  performanceRatio?: number
  clawbackAmount?: number

  calculationDetails: any
}

export interface CommissionReport {
  period: string
  commissions: Array<{
    id: number
    agentId: number
    agentName: string
    agentType: string
    period: string
    transactionCount: number
    totalAmount: number
    eligibleAmount: number
    commissionRate: number
    commissionAmount: number
    payband: number
    finalCommission: number
    kpiScores?: {
      activeness: number
      valueTransacted: number
      uniqueAgents: number
      total: number
    }
    capitalAdvanced?: number
    expectedTurnover?: number
    actualTurnover?: number
    performanceRatio?: number
    clawbackAmount?: number
    calculationDetails: any
    status: string
    createdAt: Date
    updatedAt: Date
    agent?: {
      accountNumber: string
      branchName: string
      parentAgentId: number | null
    }
  }>
  summary: {
    totalAgents: number
    totalCommission: number
    totalTransactions: number
    totalAmount: number
    averageCommission: number
    byType: {
      local_agent: {
        count: number
        totalCommission: number
      }
      super_agent: {
        count: number
        totalCommission: number
      }
      franchise: {
        count: number
        totalCommission: number
      }
    }
  }
}

export interface CommissionHistoryItem {
  period: string
  totalCommission: number
  totalAgents: number
  commissions: CommissionReport['commissions']
}

export interface CreateCommissionConfigDto {
  title: string
  code: string
  description?: string
  type?: string
  value: number
  agentType?: string
  status?: string
  minTransactionAmount?: number
  commissionRate?: number
  paybandFee?: number
  superAgentCommissionRate?: number
  superAgentFixedRate?: number
  superAgentVariableRate?: number
  franchiseMultiplier?: number
  franchiseBaseRate?: number
  kpiWeights?: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }
  paybandRates?: {
    excellent: { min: number; rate: number }
    good: { min: number; max: number; rate: number }
    average: { min: number; max: number; rate: number }
    belowAverage: { min: number; max: number; rate: number }
    poor: { max: number; rate: number }
  }
  assignedUsers?: number[]
}

export interface UpdateCommissionConfigDto extends Partial<CreateCommissionConfigDto> {
  id: number
}
