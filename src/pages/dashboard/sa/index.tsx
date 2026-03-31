import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress, LinearProgress } from '@mui/material'
import { useAuth } from 'src/hooks/useAuth'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

interface AgentStats {
  id: number
  name: string
  transactionCount: number
  totalAmount: number
  commission: number
  performance: number
}

const SuperAgentDashboard = () => {
  const { agentData } = useAuth()
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    expectedCommission: 0,
    kpiScore: 0
  })
  const [agents, setAgents] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token || !agentData?.id) return

      const response = await fetch('/api/dashboard/super-agent', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          totalAgents: data.summary?.agentsServed || 0,
          totalTransactions: data.summary?.totalTransactions || 0,
          totalAmount: data.summary?.totalAmount || 0,
          expectedCommission: data.summary?.expectedCommission || 0,
          kpiScore: 85
        })
        setAgents(data.agentPerformance || [])
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
          {agentData?.name || 'Super Agent'} Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Monitor your agents and track commission performance
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalAgents.toLocaleString()}
          title='Agents Served'
          subtitle='Under Your Network'
          avatarIcon='tabler:users'
          avatarColor='primary'
          chipText='+8%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalTransactions.toLocaleString()}
          title='Transactions'
          subtitle='Total Volume'
          avatarIcon='tabler:receipt'
          avatarColor='success'
          chipText='+12%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalAmount)}`}
          title='Total Amount'
          subtitle='Transaction Value'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText='+15%'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.expectedCommission)}`}
          title='Expected Commission'
          subtitle='This Month'
          avatarIcon='tabler:chart-line'
          avatarColor='info'
          chipText='+18%'
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              KPI Performance
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 2 }}>
              <CircularProgress
                variant='determinate'
                value={stats.kpiScore}
                size={120}
                thickness={8}
                color={stats.kpiScore >= 80 ? 'success' : stats.kpiScore >= 60 ? 'warning' : 'error'}
              />
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Typography variant='h4'>{stats.kpiScore}%</Typography>
              </Box>
            </Box>
            <Typography variant='body2' color='text.secondary' textAlign='center'>
              {stats.kpiScore >= 80
                ? 'Excellent Performance'
                : stats.kpiScore >= 60
                ? 'Good Performance'
                : 'Needs Improvement'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Agent Performance
            </Typography>
            {agents.slice(0, 5).map(agent => (
              <Box key={agent.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant='body2' fontWeight='500'>
                    {agent.name}
                  </Typography>
                  <Typography variant='body2' color='success.main'>
                    TZS {formatCurrency(agent.commission)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(agent.totalAmount / Math.max(...agents.map(a => a.totalAmount))) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                  color='primary'
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

SuperAgentDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default SuperAgentDashboard
