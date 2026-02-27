import { useRouter } from 'next/router'
import { useAuth } from './useAuth'
import { getDashboardRoute } from 'src/configs/dashboard-routes'

// Simple hook that returns basic access control functions
export const useAccessControl = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Simple role check
  const hasAccessToRoute = (requiredRole: string | string[]): boolean => {
    if (!user || loading) return false

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role)
    }

    return user.role === requiredRole
  }

  // Redirect if user doesn't have access
  const requireRole = (requiredRole: string | string[]) => {
    if (loading) return false

    if (!user) {
      router.replace('/login')

      return false
    }

    const hasAccess = hasAccessToRoute(requiredRole)

    if (!hasAccess) {
      const dashboardRoute = getDashboardRoute(user.role)
      console.log(`Access denied. Redirecting ${user.role} to ${dashboardRoute}`)
      router.replace(dashboardRoute)

      return false
    }

    return true
  }

  return {
    hasAccessToRoute,
    requireRole,
    user,
    loading
  }
}
