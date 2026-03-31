import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { useAuth } from 'src/hooks/useAuth'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const FranchiseDashboard = () => {
  const { agentData } = useAuth()
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    performanceRatio: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token || !agentData?.id) return

      const response = await fetch('/api/dashboard/franchise', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          totalAgents: data.summary?.agentsServed?.totalAgents || 0,
          totalTransactions: data.summary?.transactions?.totalTransactions || 0,
          totalAmount: data.summary?.transactions?.totalAmount || 0,
          totalCommission: data.summary?.commission?.totalCommission || 0,
          performanceRatio: 94
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [agentData])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 })
      .format(amount)
      .replace('TZS', '')
      .trim()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' gutterBottom>
          {agentData?.name || 'Franchise'} Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Track your network performance and commission earnings
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalAgents.toLocaleString()}
          title='Total Agents'
          subtitle='In Your Network'
          avatarIcon='tabler:users'
          avatarColor='primary'
          chipText='+3%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalTransactions.toLocaleString()}
          title='Transactions'
          subtitle='Total Volume'
          avatarIcon='tabler:receipt'
          avatarColor='success'
          chipText='+8%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalAmount)}`}
          title='Total Amount'
          subtitle='Turnover'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText='+12%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalCommission)}`}
          title='Commission Earned'
          subtitle='This Month'
          avatarIcon='tabler:chart-line'
          avatarColor='info'
          chipText='+15%'
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Performance Overview
            </Typography>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Performance Ratio
                </Typography>
                <Typography variant='h3' color='success.main'>
                  {stats.performanceRatio}%
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Required Target (4.5x)
                </Typography>
                <Typography variant='h5'>TZS {formatCurrency(stats.totalAmount * 4.5)}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Current Turnover
                </Typography>
                <Typography variant='h5'>TZS {formatCurrency(stats.totalAmount)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

FranchiseDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default FranchiseDashboard
