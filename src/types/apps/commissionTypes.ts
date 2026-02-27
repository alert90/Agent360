export type AgentType = 'super_agent' | 'franchise' | 'local_agent'

export interface Agent {
  id: string
  name: string
  accountNumber: string
  type: AgentType
  branchCode: string
  branchName: string
  parentAgentId?: string // For agents served by super agents or franchises
  isActive: boolean
  totalTransactionAmount: number
  transactionCount: number
  commissionAmount: number
  payband?: number
}

export interface CommissionCalculation {
  agentId: string
  agentName: string
  agentType: AgentType
  totalAmount: number
  transactionCount: number
  eligibleAmount: number
  commissionRate: number
  commissionAmount: number
  payband: number
  finalCommission: number
  period: string
}

export interface SuperAgentKPI {
  activenessWeight: number // 55%
  valueTransactedWeight: number // 25%
  uniqueAgentsWeight: number // 20%
  activenessScore: number
  valueTransactedScore: number
  uniqueAgentsScore: number
  totalScore: number
}

export interface FranchiseCalculation {
  franchiseId: string
  franchiseName: string
  agentToCustomerValue: number
  expectedTurnover: number // agentToCustomerValue * 4.5
  actualTurnover: number
  payband: number
  commissionRate: number
  commissionAmount: number
  clawbackAmount: number
  finalCommission: number
}

export interface Payband {
  tier: string
  minPercentage: number
  maxPercentage: number
  multiplier: number
}

export const PAYBANDS: Payband[] = [
  { tier: 'a', minPercentage: 100, maxPercentage: Infinity, multiplier: 1.0 },
  { tier: 'b', minPercentage: 80, maxPercentage: 99, multiplier: 0.8 },
  { tier: 'c', minPercentage: 60, maxPercentage: 79, multiplier: 0.6 },
  { tier: 'd', minPercentage: 40, maxPercentage: 59, multiplier: 0.4 },
  { tier: 'e', minPercentage: 0, maxPercentage: 39, multiplier: 0.2 },
  { tier: 'f', minPercentage: 0, maxPercentage: 39, multiplier: 0.2 }
]

export interface CSVTransactionRow {
  TRANSACTIONID1?: string
  AGENTSNAME?: string
  BRC?: string
  TRXDATE?: string
  AGNTACCNT?: string
  NARRATION?: string
  AMOUNTDEBIT?: string
  AMOUNTCREDIT?: string
  CSTMACCNT?: string
  CSTMNAME?: string
  CHANNEL?: string
  BRCHNAME?: string

  // Allow additional dynamic fields
  [key: string]: any
}

export interface CommissionConfig {
  id: string
  title: string
  code: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: number
  agentType: AgentType | 'all'
  status: 'active' | 'inactive' | 'suspended'
  startDate: Date
  endDate: Date
  minTransactionAmount: number
  maxTransactions?: number
  commissionRate: number
  paybandFee: number
  superAgentCommissionRate: number // 20%
  superAgentFixedRate: number // 30% of 20% = 6%
  superAgentVariableRate: number // 70% of 20% = 14%
  franchiseMultiplier: number // 4.5
  kpiWeights: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface CommissionReport {
  id: string
  period: string
  startDate: Date
  endDate: Date
  totalTransactions: number
  totalAmount: number
  totalCommission: number
  agentCalculations: CommissionCalculation[]
  superAgentCalculations: CommissionCalculation[]
  franchiseCalculations: FranchiseCalculation[]
  generatedAt: Date
  status: 'draft' | 'approved' | 'paid'
}
