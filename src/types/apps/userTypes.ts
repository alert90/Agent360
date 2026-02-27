// ** Types
import { ThemeColor } from 'src/@core/layouts/types'

export type UserRole = 'admin' | 'analyst' | 'super_agent' | 'franchise' | 'agent'

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type UsersType = {
  id: number
  role: UserRole
  email: string
  status: UserStatus
  avatar: string
  billing: string
  company: string
  country: string
  contact: string
  fullName: string
  username: string
  currentPlan: string
  permissions: string[]
  avatarColor?: ThemeColor
  location?: string
  zone?: string
  parentId?: number
  kpiScore?: number
  performanceRating?: number
  joinDate: string
  lastLogin?: string
}

export interface CommissionData {
  id: string
  userId: number
  userRole: UserRole
  period: string // YYYY-MM
  totalCommission: number
  fixedCommission: number
  variableCommission: number
  kpiScore: number
  performanceThresholdMet: boolean
  transactionsCount: number
  transactionValue: number
  status: 'pending' | 'approved' | 'paid'
  paidDate?: string
}

export interface KPIData {
  id: string
  userId: number
  name: string
  score: number
  weight: number
  target: number
  current: number
  type: 'default' | 'custom'
  period: string
}

export interface AgentData {
  id: string
  name: string
  account_number: string
  type: 'local_agent' | 'super_agent' | 'franchise'
  branch_code: string
  branch_name: string
  parent_agent_id?: number
  is_active: boolean
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  payband: number
  superAgentId?: number
  franchiseId?: number
  status: 'active' | 'inactive' | 'pending'
  totalTransactions: number
  transactionValue: number
  lastTransaction: string
  commissionContribution: number
  location: string
  zone: string
  balance: number
  kpiScore: number
  created_at: string
  updated_at: string
}

export interface AgentConnection {
  id: number
  agent_id: number
  agent_name: string
  parent_agent_id?: number
  parent_name?: string
  parent_type?: 'super_agent' | 'franchise'
  relationship: 'child' | 'parent'
  account_number: string
  branch_name: string
  zone?: string
}

export interface AgentTransaction {
  id: number
  transaction_id: string
  agent_id: number
  agent_name: string
  customer_name: string
  customer_phone?: string
  customer_account?: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment'
  amount: number
  fee: number
  net_amount: number
  commission_amount: number
  commission_eligible: boolean
  status: string
  location?: string
  zone?: string
  channel?: string
  narration?: string
  reference?: string
  initiated_by: string
  timestamp: string
  created_at: string
}

export interface TransactionData {
  id: string
  agentId: string
  agentName: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  customerPhone: string
  timestamp: string
  initiatedBy: 'franchise' | 'customer' | 'agent'
  commissionEligible: boolean
  status: 'completed' | 'pending' | 'failed'
  location: string
  zone: string
}

export interface ZoneData {
  id: string
  name: string
  region: string
  superAgents: number
  franchises: number
  agents: number
  totalTransactions: number
  transactionValue: number
  performance: number
}

export interface CommissionConfig {
  id: string
  role: UserRole
  baseRate: number
  kpiMultiplier: number
  performanceThreshold: number
  maxCommission: number
  paybandRanges: {
    min: number
    max: number
    multiplier: number
  }[]
}

export type ProjectListDataType = {
  id: number
  img: string
  hours: string
  totalTask: string
  projectType: string
  projectTitle: string
  progressValue: number
  progressColor: ThemeColor
}
