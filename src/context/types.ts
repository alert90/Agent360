export type ErrCallbackType = (err: { [key: string]: string }) => void

export type LoginParams = {
  email: string
  password: string
  rememberMe?: boolean
}

export type UserRole = 'admin' | 'analyst' | 'super_agent' | 'franchise' | 'agent'

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
}

export type AuthValuesType = {
  loading: boolean
  logout: () => void
  user: UserDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  login: (params: LoginParams, errorCallback?: ErrCallbackType) => void
}
