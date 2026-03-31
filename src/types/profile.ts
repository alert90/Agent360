// Profile related types based on database schema

export interface UserProfileData {
  id: number
  email: string
  full_name: string
  username: string
  role: 'admin' | 'analyst' | 'rms' | 'super_agent' | 'franchise' | 'agent'
  permissions?: string
  location?: string
  zone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AgentData {
  id: number
  account_number: string
  name: string
  type: 'local_agent' | 'super_agent' | 'franchise'
  branch_code: string
  branch_name: string
  parent_agent_id?: number
  is_active: boolean
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  payband: number
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

export interface ProfileTeamsType {
  title: string
  value: string
  icon: string
  color?: string
  avatar?: string
  members?: string
  chipText?: string
}

export interface ProfileConnectionsType {
  id: number
  name: string
  avatar: string
  isFriend?: boolean
  connections: string
  account_number?: string
  branch_name?: string
  zone?: string
}

export interface ProfileTabData {
  about: Array<{
    property: string
    value: string
    icon: string
  }>
  contacts: Array<{
    property: string
    value: string
    icon: string
  }>
  teams: ProfileTeamsType[]
  overview: Array<{
    property: string
    value: string
    icon: string
  }>
  connections: ProfileConnectionsType[]
  transactions: AgentTransaction[]
}

export interface ProfileHeaderData {
  fullName: string
  designation: string
  location?: string
  joiningDate: string
  profileImg: string
  designationIcon: string
  coverImg: string
}
