// src/types/commissionTypes.ts
export interface CommissionType {
  id: number
  name: string
  type: 'SUPER_AGENT' | 'FRANCHISE'
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SuperAgentCommissionConfig {
  commissionRate: number // 20% of total transactions
  fixedCommissionPercentage: number // 30%
  variableCommissionPercentage: number // 70%
  baselineThreshold: number // 100,000 TZS
  kpiWeights: {
    agentActiveness: number // 55%
    valueTransacted: number // 20%
    uniqueAgents: number // 25%
  }
  kpiBands: KPIBand[]
}

export interface FranchiseCommissionConfig {
  baseRate: number // 0.05%
  multiplier: number // 4.5x
  paybands: Payband[]
}

export interface KPIBand {
  min: number
  max: number
  rate: number
}

export interface Payband {
  min: number
  max: number
  name: string
  apportionRate: number
  clawbackPercentage: number
}

export const DEFAULT_KPI_BANDS: KPIBand[] = [
  { min: 0, max: 50, rate: 0 },
  { min: 51, max: 60, rate: 20 },
  { min: 61, max: 70, rate: 40 },
  { min: 71, max: 80, rate: 60 },
  { min: 81, max: 90, rate: 80 },
  { min: 91, max: 100, rate: 100 }
]

export const DEFAULT_PAYBANDS: Payband[] = [
  { min: 100, max: 100, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
  { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
  { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
  { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
  { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
]
