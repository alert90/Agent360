// ** React Imports
import { useState, useEffect, useMemo } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { SelectChangeEvent } from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomTextField from 'src/@core/components/mui/text-field'

interface AgentAnalyticsData {
  id: number
  name: string
  account_number: string
  type: string
  branch_code: string
  branch_name: string
  is_active: number
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  zone?: string
}

const AgentAnalytics = () => {
  const [agents, setAgents] = useState<AgentAnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedZone, setSelectedZone] = useState('all')
  const [zones, setZones] = useState<string[]>([])

  useEffect(() => {
    fetchAgentAnalytics()
  }, [])

  const fetchAgentAnalytics = async () => {
    try {
      const response = await fetch('/api/agents/list?limit=1000') // Get all agents for analytics
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgents(result.data)

          // Extract unique zones
          const uniqueZones = [...new Set(result.data.map((agent: AgentAnalyticsData) => agent.zone || 'Unknown').filter(Boolean))]
          setZones(['all', ...uniqueZones.sort()])
        }
      }
    } catch (error) {
      console.error('Error fetching agent analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedAgents = useMemo(() => {
    return agents
      .filter(agent => {
        const matchesSearch =
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = selectedType === 'all' || agent.type === selectedType
        const matchesZone = selectedZone === 'all' || agent.zone === selectedZone
        return matchesSearch && matchesType && matchesZone
      })
      .sort((a, b) => b.total_transaction_amount - a.total_transaction_amount) // Sort by transaction amount desc
  }, [agents, searchTerm, selectedType, selectedZone])

  const summary = useMemo(() => {
    const filtered = filteredAndSortedAgents
    const totalAgents = filtered.length
    const activeAgents = filtered.filter(a => a.is_active).length
    const totalTransactions = filtered.reduce((sum, a) => sum + a.transaction_count, 0)
    const totalAmount = filtered.reduce((sum, a) => sum + a.total_transaction_amount, 0)
    const totalCommission = filtered.reduce((sum, a) => sum + a.commission_amount, 0)
    const avgTransactionsPerAgent = totalAgents > 0 ? totalTransactions / totalAgents : 0

    return {
      totalAgents,
      activeAgents,
      totalTransactions,
      totalAmount,
      totalCommission,
      avgTransactionsPerAgent
    }
  }, [filteredAndSortedAgents])

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary'
      case 'franchise':
        return 'secondary'
      case 'local_agent':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading agent analytics data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Agent Analytics
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Comprehensive analytics and performance metrics for agents
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='primary.main' sx={{ mb: 1 }}>
                {summary.totalAgents}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='success.main' sx={{ mb: 1 }}>
                {summary.activeAgents}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Active Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='info.main' sx={{ mb: 1 }}>
                {summary.totalTransactions}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='warning.main' sx={{ mb: 1 }}>
                TZS {summary.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Transaction Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='secondary.main' sx={{ mb: 1 }}>
                TZS {summary.totalCommission.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='Search Agents'
                placeholder='Search by name, account, or branch...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Icon icon='tabler:search' style={{ marginRight: 8 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label='Agent Type'
                SelectProps={{ value: selectedType, onChange: e => setSelectedType(e.target.value) }}
              >
                <MenuItem value='all'>All Types</MenuItem>
                <MenuItem value='super_agent'>Super Agents</MenuItem>
                <MenuItem value='franchise'>Franchises</MenuItem>
                <MenuItem value='local_agent'>Local Agents</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label='Zone'
                SelectProps={{ value: selectedZone, onChange: e => setSelectedZone(e.target.value) }}
              >
                {zones.map(zone => (
                  <MenuItem key={zone} value={zone}>
                    {zone === 'all' ? 'All Zones' : zone}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader
          title='Agent Performance Analytics'
          subheader={`${filteredAndSortedAgents.length} agents found`}
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Zone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Transactions</TableCell>
                  <TableCell align='right'>Total Amount</TableCell>
                  <TableCell align='right'>Commission</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedAgents.map(agent => (
                  <TableRow key={agent.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {agent.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {agent.account_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agent.type.replace('_', ' ').toUpperCase()}
                        size='small'
                        color={getAgentTypeColor(agent.type) as any}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>{agent.branch_name}</TableCell>
                    <TableCell>{agent.zone || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.is_active ? 'Active' : 'Inactive'}
                        size='small'
                        color={agent.is_active ? 'success' : 'default' as any}
                        variant='filled'
                      />
                    </TableCell>
                    <TableCell align='right'>{agent.transaction_count}</TableCell>
                    <TableCell align='right'>TZS {agent.total_transaction_amount.toLocaleString()}</TableCell>
                    <TableCell align='right'>TZS {agent.commission_amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No agents found for the selected criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

AgentAnalytics.acl = {
  action: 'read',
  subject: 'analytics'
}

export default AgentAnalytics
