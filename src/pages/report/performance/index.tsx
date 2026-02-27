import { useState, useEffect, useMemo } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface AgentPerformance {
  id: string
  name: string
  account_number: string
  type: string
  total_transactions: number
  total_amount: number
  avg_transaction: number
  commission_amount: number
  performance_score: number
  last_transaction: string
}

interface PerformanceSummary {
  totalAgents: number
  totalTransactions: number
  totalAmount: number
  avgPerformance: number
  topPerformer: AgentPerformance | null
  superAgentCount: number
  franchiseCount: number
  localAgentCount: number
}

const PerformanceReport = () => {
  const [agents, setAgents] = useState<AgentPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('performance_score')

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      // Fetch agents with their performance metrics
      const response = await fetch('/api/agents/performance')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgents(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedAgents = useMemo(() => {
    return agents
      .filter(agent => {
        const matchesSearch =
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.account_number.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = selectedType === 'all' || agent.type === selectedType

        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'total_amount':
            return b.total_amount - a.total_amount
          case 'total_transactions':
            return b.total_transactions - a.total_transactions
          case 'performance_score':
          default:
            return b.performance_score - a.performance_score
        }
      })
  }, [agents, searchTerm, selectedType, sortBy])

  const summary = useMemo((): PerformanceSummary => {
    const filtered = filteredAndSortedAgents
    const totalAgents = filtered.length
    const totalTransactions = filtered.reduce((sum, a) => sum + a.total_transactions, 0)
    const totalAmount = filtered.reduce((sum, a) => sum + a.total_amount, 0)
    const avgPerformance = totalAgents > 0 ? filtered.reduce((sum, a) => sum + a.performance_score, 0) / totalAgents : 0

    const topPerformer =
      totalAgents > 0
        ? filtered.reduce((best, current) => (current.performance_score > best.performance_score ? current : best))
        : null

    const superAgentCount = filtered.filter(a => a.type === 'super_agent').length
    const franchiseCount = filtered.filter(a => a.type === 'franchise').length
    const localAgentCount = filtered.filter(a => a.type === 'local_agent').length

    return {
      totalAgents,
      totalTransactions,
      totalAmount,
      avgPerformance,
      topPerformer,
      superAgentCount,
      franchiseCount,
      localAgentCount
    }
  }, [filteredAndSortedAgents])

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'

    return 'error'
  }

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

  const exportToCSV = () => {
    const headers = [
      'Agent ID',
      'Agent Name',
      'Type',
      'Total Transactions',
      'Total Amount',
      'Average Transaction',
      'Commission',
      'Performance Score',
      'Last Transaction'
    ]

    const csvData = filteredAndSortedAgents.map(a => [
      a.account_number,
      a.name,
      a.type.replace('_', ' ').toUpperCase(),
      a.total_transactions,
      a.total_amount.toLocaleString(),
      a.avg_transaction.toLocaleString(),
      a.commission_amount.toLocaleString(),
      a.performance_score.toFixed(1),
      a.last_transaction
    ])

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading performance data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Agent Performance Report
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Performance metrics and analytics for all agents
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Icon icon='tabler:download' />}
          onClick={exportToCSV}
          disabled={filteredAndSortedAgents.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='success.main' sx={{ mb: 1 }}>
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
              <Typography variant='h4' color='info.main' sx={{ mb: 1 }}>
                TZS {summary.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='warning.main' sx={{ mb: 1 }}>
                {summary.avgPerformance.toFixed(1)}%
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Avg Performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label='Search Agents'
                placeholder='Search by name or account...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Icon icon='tabler:search' style={{ marginRight: 8 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Agent Type</InputLabel>
                <Select value={selectedType} label='Agent Type' onChange={e => setSelectedType(e.target.value)}>
                  <MenuItem value='all'>All Types</MenuItem>
                  <MenuItem value='super_agent'>Super Agents</MenuItem>
                  <MenuItem value='franchise'>Franchises</MenuItem>
                  <MenuItem value='local_agent'>Local Agents</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} label='Sort By' onChange={e => setSortBy(e.target.value)}>
                  <MenuItem value='performance_score'>Performance Score</MenuItem>
                  <MenuItem value='total_amount'>Total Amount</MenuItem>
                  <MenuItem value='total_transactions'>Transactions</MenuItem>
                  <MenuItem value='name'>Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1 }}>
                <Chip label={`${summary.superAgentCount} SA`} color='primary' size='small' variant='outlined' />
                <Chip label={`${summary.franchiseCount} FR`} color='secondary' size='small' variant='outlined' />
                <Chip label={`${summary.localAgentCount} LA`} color='default' size='small' variant='outlined' />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Performer Card */}
      {summary.topPerformer && (
        <Card sx={{ mb: 6 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon='tabler:trophy' color='warning' style={{ fontSize: 32 }} />
              <Box>
                <Typography variant='h6' color='warning.main'>
                  Top Performer
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {summary.topPerformer.name} ({summary.topPerformer.account_number})
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Performance Score: {summary.topPerformer.performance_score.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader title='Agent Performance Metrics' subheader={`${filteredAndSortedAgents.length} agents found`} />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align='right'>Transactions</TableCell>
                  <TableCell align='right'>Total Amount</TableCell>
                  <TableCell align='right'>Avg Transaction</TableCell>
                  <TableCell align='right'>Commission</TableCell>
                  <TableCell align='right'>Performance</TableCell>
                  <TableCell>Last Activity</TableCell>
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
                    <TableCell align='right'>{agent.total_transactions}</TableCell>
                    <TableCell align='right'>TZS {agent.total_amount.toLocaleString()}</TableCell>
                    <TableCell align='right'>TZS {agent.avg_transaction.toLocaleString()}</TableCell>
                    <TableCell align='right'>TZS {agent.commission_amount.toLocaleString()}</TableCell>
                    <TableCell align='right'>
                      <Chip
                        label={`${agent.performance_score.toFixed(1)}%`}
                        size='small'
                        color={getPerformanceColor(agent.performance_score) as any}
                        variant='filled'
                      />
                    </TableCell>
                    <TableCell>{agent.last_transaction}</TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No performance data found for the selected criteria
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

PerformanceReport.acl = {
  action: 'read',
  subject: 'reports'
}

export default PerformanceReport
