// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Utils
import { getDashboardRoute } from 'src/configs/dashboard-routes'

const Home = () => {
  // ** Hooks
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to role-specific dashboard
        const dashboardRoute = getDashboardRoute(user.role)
        console.log(`Redirecting ${user.role} to: ${dashboardRoute}`)
        router.replace(dashboardRoute)
      } else {
        console.log('No user found, redirecting to login')
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}
    >
      <CircularProgress />
      <Box sx={{ ml: 2 }}>Redirecting...</Box>
    </Box>
  )
}

// Disable default auth guard for this page since it handles its own redirects
Home.authGuard = false

export default Home
