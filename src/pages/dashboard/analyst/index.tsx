// pages/dashboard/analyst/index.tsx
import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import axios from 'axios'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

interface DashboardStats {
  totalAgents: number
  totalFranchise: number
  totalSuperAgents: number
  totalTransactions: number
  totalAmount: number
  totalCommission: number
}

const AnalystDashboard = () => {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    totalFranchise: 0,
    totalSuperAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0
  })
  const [topAgents, setTopAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Fetch agent stats from agents list API
      const agentsResponse = await axios.get('/api/agents/list', {
        headers,
        params: { page: 1, limit: 1 }
      })

      if (agentsResponse.data.success) {
        setStats(prev => ({
          ...prev,
          totalAgents: agentsResponse.data.stats?.totalAgents || 0,
          totalFranchise: agentsResponse.data.stats?.totalFranchise || 0,
          totalSuperAgents: agentsResponse.data.stats?.totalSuperAgents || 0
        }))
      }

      // Fetch transaction stats
      const transactionsResponse = await axios.get('/api/transactions/list', {
        headers,
        params: { page: 1, limit: 1 }
      })

      if (transactionsResponse.data.success) {
        setStats(prev => ({
          ...prev,
          totalTransactions: transactionsResponse.data.stats?.totalTransactions || 0,
          totalAmount: transactionsResponse.data.stats?.totalAmount || 0,
          totalCommission: transactionsResponse.data.stats?.totalCommission || 0
        }))
      }

      // Fetch top performing agents
      const topAgentsResponse = await axios.get('/api/agents/list', {
        params: { page: 1, limit: 50, sortBy: 'transaction_count', sortOrder: 'desc' }
      })

      if (topAgentsResponse.data.success) {
        setTopAgents(topAgentsResponse.data.data.slice(0, 10))
      }
    } catch (error) {
      console.error('Failed to fetch analyst dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
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
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' gutterBottom>
          Analyst Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Performance analytics and commission insights
        </Typography>
      </Grid>

      {/* Agent Stats - From AGENTS table */}
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalAgents.toLocaleString()}
          title='Total Agents'
          subtitle='All Agent Accounts'
          avatarIcon='tabler:users'
          avatarColor='primary'
          chipText='+12%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalSuperAgents.toLocaleString()}
          title='Super Agents'
          subtitle='Super Agent Accounts'
          avatarIcon='tabler:star'
          avatarColor='warning'
          chipText='+8%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalFranchise.toLocaleString()}
          title='Franchises'
          subtitle='Franchise Accounts'
          avatarIcon='tabler:building-store'
          avatarColor='secondary'
          chipText='+5%'
        />
      </Grid>

      {/* Transaction Stats */}
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalTransactions.toLocaleString()}
          title='Transactions'
          subtitle='All Time'
          avatarIcon='tabler:receipt'
          avatarColor='success'
          chipText='+8%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalAmount)}`}
          title='Total Amount'
          subtitle='Transaction Volume'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText='+15%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalCommission)}`}
          title='Total Commission'
          subtitle='Earned'
          avatarIcon='tabler:chart-line'
          avatarColor='info'
          chipText='+22%'
        />
      </Grid>

      {/* Top Performing Agents Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Top Performing Agents
            </Typography>
            <DataGrid
              autoHeight
              rows={topAgents}
              columns={[
                {
                  field: 'name',
                  headerName: 'Agent Name',
                  flex: 0.3,
                  renderCell: ({ row }: any) => (
                    <Typography
                      sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => router.push(`/agents/view/${row.id}`)}
                    >
                      {row.name}
                    </Typography>
                  )
                },
                { field: 'type', headerName: 'Type', flex: 0.15 },
                { field: 'transaction_count', headerName: 'Transactions', flex: 0.15, type: 'number' },
                {
                  field: 'total_transaction_amount',
                  headerName: 'Total Amount',
                  flex: 0.2,
                  renderCell: ({ row }: any) => (
                    <Typography fontWeight='bold'>TZS {formatCurrency(row.total_transaction_amount)}</Typography>
                  )
                },
                {
                  field: 'commission_amount',
                  headerName: 'Commission',
                  flex: 0.2,
                  renderCell: ({ row }: any) => (
                    <Typography color='success.main'>TZS {formatCurrency(row.commission_amount)}</Typography>
                  )
                }
              ]}
              pageSizeOptions={[10]}
              paginationModel={{ page: 0, pageSize: 10 }}
              disableRowSelectionOnClick
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

AnalystDashboard.acl = {
  action: 'read',
  subject: 'analytics'
}

export default AnalystDashboard
