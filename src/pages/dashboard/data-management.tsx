import { useState, useEffect } from 'react'
import { Grid, Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from 'src/hooks/useAuth'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const DataManagementDashboard = () => {
  const { agentData } = useAuth()
  const [stats, setStats] = useState({
    transactions: 0,
    totalAmount: 0,
    commission: 0,
    performance: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token || !agentData?.id) return

      const response = await fetch(`/api/agents/${agentData.id}/transactions?page=1&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          transactions: data.summary?.totalTransactions || 0,
          totalAmount: data.summary?.totalAmount || 0,
          commission: data.summary?.totalCommission || 0,
          performance: 85
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
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
          My Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Track your transaction activity and commission earnings
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.transactions.toLocaleString()}
          title='My Transactions'
          subtitle='Total Count'
          avatarIcon='tabler:receipt'
          avatarColor='primary'
          chipText='+5%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalAmount)}`}
          title='Total Amount'
          subtitle='Transaction Value'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText='+12%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.commission)}`}
          title='Commission Earned'
          subtitle='This Month'
          avatarIcon='tabler:chart-line'
          avatarColor='success'
          chipText='+8%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`${stats.performance}%`}
          title='Performance'
          subtitle='Target Achievement'
          avatarIcon='tabler:target'
          avatarColor='info'
          chipText='+3%'
        />
      </Grid>
    </Grid>
  )
}

DataManagementDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default DataManagementDashboard
