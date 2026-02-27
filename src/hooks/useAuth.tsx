// ** React Imports
import { useContext } from 'react'

// ** Context Imports
import { AuthContext } from 'src/context/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
