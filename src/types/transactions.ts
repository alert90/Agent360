// src/types/transactions.ts
export interface Transaction {
  id: number
  transactionId: string
  reference: string
  agentName: string
  amount: number
  type: string
  status: string
  timestamp: string
  narration: string
  location: string
  commissionAmount: number
  fee: number
  netAmount: number
  customerName: string
  customerAccount: string
}

export interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  totalCommission: number
  avgTransactionAmount: number
}

export interface AgentFilter {
  value: string
  label: string
}

export interface PaginationResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse {
  success: boolean
  data: Transaction[]
  pagination: PaginationResponse
  stats: TransactionStats
  filters?: {
    agents: AgentFilter[]
  }
}
