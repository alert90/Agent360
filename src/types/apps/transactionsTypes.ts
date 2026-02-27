export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled'
export type TransactionTypeEnum = 'deposit' | 'withdrawal' | 'transfer' | 'payment'
export type InitiatedBy = 'customer' | 'agent' | 'franchise' | 'system'

export interface TransactionType {
  id: string
  agentId: string
  agentName: string
  customerName: string
  customerPhone: string
  customerAccount?: string
  type: TransactionTypeEnum
  amount: number
  fee: number
  netAmount: number
  timestamp: string
  initiatedBy: InitiatedBy
  commissionEligible: boolean
  commissionAmount: number
  status: TransactionStatus
  location: string
  zone: string
  branchCode?: string
  reference: string
  notes?: string
}

export interface TransactionFilters {
  status: TransactionStatus | ''
  type: TransactionTypeEnum | ''
  dateRange: {
    start: Date | null
    end: Date | null
  }
  agent: string
  zone: string
}
