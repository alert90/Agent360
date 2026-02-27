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

interface Commission {
  id: number
  agent_id: string
  agent_name: string
  agent_type: string
  period: string
  total_amount: number
  transaction_count: number
  eligible_amount: number
  commission_rate: number
  commission_amount: number
  payband: number
  final_commission: number
  created_at: string
}

interface CommissionSummary {
  totalCommissions: number
  totalAmount: number
  totalTransactions: number
  avgCommission: number
  superAgentCount: number
  franchiseCount: number
  localAgentCount: number
}

const CommissionOverview = () => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [periods, setPeriods] = useState<string[]>([])

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/commissions/history')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCommissions(result.data)

          // Extract unique periods
          const uniquePeriods = [...new Set(result.data.map((c: Commission) => c.period))].sort().reverse() as string[]
          setPeriods(uniquePeriods)

          // Set default period to latest
          if (uniquePeriods.length > 0) {
            setSelectedPeriod(uniquePeriods[0])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCommissions = useMemo(() => {
    return commissions.filter(commission => {
      const agentName = commission.agent_name || ''
      const agentId = commission.agent_id || ''
      const matchesSearch =
        agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agentId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPeriod = !selectedPeriod || commission.period === selectedPeriod
      const matchesType = selectedType === 'all' || commission.agent_type === selectedType

      return matchesSearch && matchesPeriod && matchesType
    })
  }, [commissions, searchTerm, selectedPeriod, selectedType])

  const summary = useMemo((): CommissionSummary => {
    const filtered = filteredCommissions
    const totalCommissions = filtered.length
    const totalAmount = filtered.reduce((sum, c) => sum + c.total_amount, 0)
    const totalTransactions = filtered.reduce((sum, c) => sum + c.transaction_count, 0)
    const avgCommission =
      totalCommissions > 0 ? filtered.reduce((sum, c) => sum + c.final_commission, 0) / totalCommissions : 0

    const superAgentCount = filtered.filter(c => c.agent_type === 'super_agent').length
    const franchiseCount = filtered.filter(c => c.agent_type === 'franchise').length
    const localAgentCount = filtered.filter(c => c.agent_type === 'local_agent').length

    return {
      totalCommissions,
      totalAmount,
      totalTransactions,
      avgCommission,
      superAgentCount,
      franchiseCount,
      localAgentCount
    }
  }, [filteredCommissions])

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
      'Period',
      'Transactions',
      'Total Amount',
      'Commission Rate',
      'Commission Amount',
      'Payband',
      'Final Commission'
    ]

    const csvData = filteredCommissions.map(c => [
      c.agent_id || 'N/A',
      c.agent_name || 'Unknown Agent',
      (c.agent_type || 'unknown').replace('_', ' ').toUpperCase(),
      c.period || 'N/A',
      c.transaction_count || 0,
      (c.total_amount || 0).toLocaleString(),
      `${((c.commission_rate || 0) * 100).toFixed(2)}%`,
      (c.commission_amount || 0).toLocaleString(),
      (c.payband || 0).toFixed(2),
      (c.final_commission || 0).toLocaleString()
    ])

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissions_${selectedPeriod || 'all'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading commission data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Commission Overview
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            View and manage commission calculations for all agents
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Icon icon='tabler:download' />}
          onClick={exportToCSV}
          disabled={filteredCommissions.length === 0}
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
                {summary.totalCommissions}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='success.main' sx={{ mb: 1 }}>
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
                TZS {summary.avgCommission.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Average Commission
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
                placeholder='Search by name or ID...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Icon icon='tabler:search' style={{ marginRight: 8 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select value={selectedPeriod} label='Period' onChange={e => setSelectedPeriod(e.target.value)}>
                  <MenuItem value=''>All Periods</MenuItem>
                  {periods.map(period => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1 }}>
                <Chip label={`${summary.superAgentCount} SA`} color='primary' size='small' variant='outlined' />
                <Chip label={`${summary.franchiseCount} FR`} color='secondary' size='small' variant='outlined' />
                <Chip label={`${summary.localAgentCount} LA`} color='default' size='small' variant='outlined' />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader title='Commission Payments' subheader={`${filteredCommissions.length} commission records found`} />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align='right'>Transactions</TableCell>
                  <TableCell align='right'>Total Amount</TableCell>
                  <TableCell align='right'>Commission Rate</TableCell>
                  <TableCell align='right'>Commission Amount</TableCell>
                  <TableCell align='right'>Final Commission</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCommissions.map(commission => (
                  <TableRow key={commission.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {commission.agent_name || 'Unknown Agent'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {commission.agent_id || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(commission.agent_type || 'unknown').replace('_', ' ').toUpperCase()}
                        size='small'
                        color={getAgentTypeColor(commission.agent_type || 'unknown') as any}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>{commission.period || 'N/A'}</TableCell>
                    <TableCell align='right'>{commission.transaction_count || 0}</TableCell>
                    <TableCell align='right'>TZS {(commission.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell align='right'>{((commission.commission_rate || 0) * 100).toFixed(2)}%</TableCell>
                    <TableCell align='right'>TZS {(commission.commission_amount || 0).toLocaleString()}</TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight='medium' color='success.main'>
                        TZS {(commission.final_commission || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCommissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No commission records found for the selected criteria
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

CommissionOverview.acl = {
  action: 'read',
  subject: 'commissions'
}

export default CommissionOverview
