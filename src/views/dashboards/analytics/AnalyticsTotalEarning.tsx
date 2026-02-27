// ** React Imports
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
import { ThemeColor } from 'src/@core/layouts/types'

// ** Custom Components Imports
import Icon from 'src/@core/components/icon'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomAvatar from 'src/@core/components/mui/avatar'

interface CountData {
  role?: string
  type?: string
  count: number
}

const AnalyticsTotalEarning = () => {
  // ** State
  const [userCounts, setUserCounts] = useState<CountData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        const response = await axios.get('/api/dashboard/analytics', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const userCountsData = response.data.data?.userCounts || {}
        const displayCounts = [
          { role: 'Super Agents', count: userCountsData.superAgentCount || 0 },
          { role: 'Agents', count: userCountsData.agentCount || 0 },
          { role: 'Franchises', count: userCountsData.franchiseCount || 0 }
        ]

        setUserCounts(displayCounts)
      } catch (error) {
        console.error('Error fetching counts:', error)
        setUserCounts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get total counts
  const totalUsers = userCounts.reduce((sum, item) => sum + item.count, 0)

  // Create display data
  const displayData = [
    {
      title: 'Total Users',
      amount: totalUsers,
      subtitle: 'All registered users',
      avatarColor: 'primary' as ThemeColor,
      avatarIcon: 'tabler:users'
    }
  ]

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
          displayData.map((item, index: number) => {
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ...(index === 0 && { mt: 7 }),
                  mb: index !== displayData.length - 1 ? 4 : undefined
                }}
              >
                <CustomAvatar
                  skin='light'
                  variant='rounded'
                  color={item.avatarColor}
                  sx={{ mr: 4, width: 34, height: 34 }}
                >
                  <Icon icon={item.avatarIcon} />
                </CustomAvatar>
                <Box
                  sx={{
                    rowGap: 1,
                    columnGap: 4,
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant='h6'>{item.title}</Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                      {item.subtitle}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 500, color: 'primary.main' }}>
                    {item.amount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )
          })
        )}

        {/* User breakdown */}
        {userCounts.length > 0 && (
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderTopColor: 'divider' }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              User Breakdown
            </Typography>
            {userCounts.map((userType, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  {userType.role || 'Unknown'}
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {userType.count}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsTotalEarning
