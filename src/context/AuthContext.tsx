// ** React Imports
import { createContext, useEffect, useState, ReactNode } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Config
import authConfig from 'src/configs/auth'

// ** Services
// import authService from 'src/services/authService' // Removed to avoid client-side database imports

// ** Types
import { AuthValuesType, LoginParams, ErrCallbackType, UserDataType, AgentDataType } from './types'

// ** Defaults
const defaultProvider: AuthValuesType = {
  user: null,
  agentData: null,
  loading: true,
  setUser: () => null,
  setAgentData: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}

const AuthContext = createContext(defaultProvider)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  // ** States
  const [user, setUser] = useState<UserDataType | null>(defaultProvider.user)
  const [agentData, setAgentData] = useState<AgentDataType | null>(defaultProvider.agentData)
  const [loading, setLoading] = useState<boolean>(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)!
      if (storedToken) {
        setLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

        try {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: storedToken }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          const data = await response.json()

          if (response.ok && data.userData) {
            setLoading(false)
            setUser(data.userData as UserDataType)

            // Set agent data if available
            if (data.agentData) {
              setAgentData(data.agentData as AgentDataType)
            }
          } else {
            localStorage.removeItem('userData')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('accessToken')
            setUser(null)
            setLoading(false)
            if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
              router.replace('/login')
            }
          }
        } catch (error) {
          clearTimeout(timeoutId)
          localStorage.removeItem('userData')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('accessToken')
          setUser(null)
          setLoading(false)
          if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
            router.replace('/login')
          }
        }
      } else {
        setLoading(false)
      }
    }
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (params: LoginParams, errorCallback?: ErrCallbackType) => {
    try {
      console.log('🔐 Attempting login with:', params.email)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', {
        hasToken: !!data.accessToken,
        hasUserData: !!data.userData,
        userRole: data.userData?.role,
        error: data.error
      })

      if (!response.ok) {
        console.log('❌ Login failed:', data.error)
        throw new Error(data.error?.email?.[0] || 'Login failed')
      }

      if (params.rememberMe) {
        window.localStorage.setItem(authConfig.storageTokenKeyName, data.accessToken)
        console.log('💾 Token saved to localStorage')
      }

      setUser(data.userData as UserDataType)
      if (data.agentData) {
        setAgentData(data.agentData as AgentDataType)
      }

      if (params.rememberMe) {
        window.localStorage.setItem('userData', JSON.stringify(data.userData))
      }

      console.log('✅ Login successful, redirecting...')
      router.replace('/dashboard')
    } catch (err) {
      console.error('❌ Login error in handleLogin:', err)
      if (errorCallback) errorCallback(err as { [key: string]: string })
    }
  }

  const handleLogout = () => {
    setUser(null)
    setAgentData(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')
  }

  const values = {
    user,
    agentData,
    loading,
    setUser,
    setAgentData,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
