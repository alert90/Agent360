import { useState, useEffect } from 'react'
import { Grid, CircularProgress, Box } from '@mui/material'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import axios from 'axios'

import AnalyticsEarningReports from 'src/views/dashboards/analytics/AnalyticsEarningReports'
import AnalyticsTotalEarning from 'src/views/dashboards/analytics/AnalyticsTotalEarning'
import AnalyticsTransaction from 'src/views/dashboards/analytics/AnalyticsTransaction'
import AnalyticsSalesByZone from 'src/views/dashboards/analytics/AnalyticsSalesByZone'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        // Fetch agent counts
        const agentsResponse = await axios.get('/api/agents/list', {
          headers,
          params: { page: 1, limit: 1 }
        })

        // Fetch transaction stats
        const transactionsResponse = await axios.get('/api/transactions/list', {
          headers,
          params: { page: 1, limit: 1 }
        })

        if (agentsResponse.data.success) {
          setStats(prev => ({
            ...prev,
            totalAgents: agentsResponse.data.stats?.totalAgents || 0,
            totalSuperAgents: agentsResponse.data.stats?.totalSuperAgents || 0,
            totalFranchise: agentsResponse.data.stats?.totalFranchise || 0
          }))
        }

        if (transactionsResponse.data.success) {
          setStats(prev => ({
            ...prev,
            totalTransactions: transactionsResponse.data.stats?.totalTransactions || 0,
            totalAmount: transactionsResponse.data.stats?.totalAmount || 0,
            totalCommission: transactionsResponse.data.stats?.totalCommission || 0
          }))
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={stats.totalAgents.toLocaleString()}
            chipText='+12%'
            chipColor='default'
            avatarColor='primary'
            title='Total Agents'
            subtitle='Active Network'
            avatarIcon='tabler:users'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={stats.totalTransactions.toLocaleString()}
            chipText='+8%'
            avatarColor='success'
            chipColor='default'
            title='Transactions'
            subtitle='All Time'
            avatarIcon='tabler:receipt'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={`TZS ${formatCurrency(stats.totalAmount)}`}
            chipText='+15%'
            avatarColor='warning'
            chipColor='default'
            title='Total Amount'
            subtitle='Transaction Volume'
            avatarIcon='tabler:currency-dollar'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={`TZS ${formatCurrency(stats.totalCommission)}`}
            chipText='+22%'
            avatarColor='info'
            chipColor='default'
            title='Total Commission'
            subtitle='Earned'
            avatarIcon='tabler:chart-line'
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <AnalyticsEarningReports />
        </Grid>

        <Grid item xs={12} md={6}>
          <AnalyticsTotalEarning />
        </Grid>

        <Grid item xs={12} md={6}>
          <AnalyticsSalesByZone />
        </Grid>

        <Grid item xs={12}>
          <AnalyticsTransaction />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

AdminDashboard.acl = {
  action: 'manage',
  subject: 'all'
}

export default AdminDashboard
