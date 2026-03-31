export type ErrCallbackType = (err: { [key: string]: string }) => void

export type LoginParams = {
  email: string
  password: string
  rememberMe?: boolean
}

export type UserRole = 'admin' | 'analyst' | 'rms' | 'super_agent' | 'franchise' | 'agent'

export interface AgentDataType {
  id: number
  name: string
  accountNumber: string
  type: string
  isActive: number
  parentAgentId?: number | null
  branchCode?: string | null
  branchName?: string | null
  region?: string | null
  zone?: string | null
  email?: string | null
  phone?: string | null
  contact?: string | null
}

export interface UserDataType {
  id: number
  role: UserRole
  password: string
  fullName: string
  username: string
  email: string
  permissions: string[]
  avatar?: string
  location?: string
  zone?: string
  avatarColor?: string
  billing?: string
  company?: string
  country?: string
  contact?: string
  currentPlan?: string
  status?: string
  parentId?: number
  kpiScore?: number
  performanceRating?: number
  joinDate?: string
  lastLogin?: string
  accountNumber?: string | null
}

export type AuthValuesType = {
  loading: boolean
  logout: () => void
  user: UserDataType | null
  agentData: AgentDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  setAgentData: (value: AgentDataType | null) => void
  login: (params: LoginParams, errorCallback?: ErrCallbackType) => void
}
