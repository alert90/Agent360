import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import axios from 'axios'

// ** Type Import

// ** Custom Components Imports
import Icon from 'src/@core/components/icon'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomAvatar from 'src/@core/components/mui/avatar'

interface UserCounts {
  admin: number
  analyst: number
  super_agent: number
  franchise: number
  agent: number
}

const AnalyticsTotalEarning = () => {
  const [userCounts, setUserCounts] = useState<UserCounts>({
    admin: 0,
    analyst: 0,
    super_agent: 0,
    franchise: 0,
    agent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.get('/api/users/list', {
          headers,
          params: { page: 1, limit: 1000 }
        })

        if (response.data.success) {
          const users = response.data.users || []
          const counts = {
            admin: users.filter((u: any) => u.role === 'admin').length,
            analyst: users.filter((u: any) => u.role === 'analyst').length,
            super_agent: users.filter((u: any) => u.role === 'super_agent').length,
            franchise: users.filter((u: any) => u.role === 'franchise').length,
            agent: users.filter((u: any) => u.role === 'agent').length
          }
          setUserCounts(counts)
        }
      } catch (error) {
        console.error('Error fetching user counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCounts()
  }, [])

  const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0)

  return (
    <Card>
      <CardHeader
        title='System Overview'
        action={
          <OptionsMenu
            options={['Refresh', 'Share', 'Update']}
            iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
          />
        }
        subheader={
          <Box
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& svg': { mr: 1, color: 'success.main' } }}
          >
            <Typography variant='h1' sx={{ mr: 2 }}>
              {totalUsers}
            </Typography>
            <Icon fontSize='1.25rem' icon='tabler:users' />
            <Typography variant='h6' sx={{ color: 'success.main' }}>
              Total System Users
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ mr: 4, width: 34, height: 34 }}>
                <Icon icon='tabler:users' />
              </CustomAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h6'>Total Users</Typography>
                <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                  All registered users
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 500, color: 'primary.main' }}>{totalUsers.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderTopColor: 'divider' }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                User Breakdown by Role
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Admin
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userCounts.admin}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Analyst
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userCounts.analyst}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Super Agents
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userCounts.super_agent}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Franchises
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userCounts.franchise}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Local Agents
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userCounts.agent}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsTotalEarning
