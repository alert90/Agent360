// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface CommissionCalculation {
  id: string
  agentId: string
  agentName: string
  agentType: string
  accountNumber?: string
  period: string
  totalAmount: number
  transactionCount: number
  eligibleAmount: number
  commissionRate: number
  commissionAmount: number
  payband: number
  finalCommission: number
  createdAt?: string
  kpiScores?: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
    total: number
  }
}

const CommissionHistory = () => {
  const [commissionData, setCommissionData] = useState<CommissionCalculation[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    period: '2026-01',
    agentType: ''
  })

  useEffect(() => {
    fetchCommissionHistory()
  }, [filters.period, filters.agentType])

  const fetchCommissionHistory = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.period) queryParams.append('period', filters.period)
      if (filters.agentType) queryParams.append('agentType', filters.agentType)

      const response = await fetch(`/api/commissions/history?${queryParams.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCommissionData(result.data)
          setSummary(result.summary)
        }
      }
    } catch (error) {
      console.error('Error fetching commission history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csvContent = generateCSV(commissionData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const fileName = `commission-history-${filters.period || 'all'}-${new Date().toISOString().split('T')[0]}.csv`
    link.download = fileName
    link.click()
  }

  const generateCSV = (data: CommissionCalculation[]) => {
    const headers = [
      'Agent Name',
      'Type',
      'Period',
      'Transactions',
      'Total Amount',
      'Commission Rate',
      'Final Commission'
    ]
    const rows = data.map(item => [
      item.agentName,
      item.agentType.replace('_', ' ').toUpperCase(),
      item.period,
      item.transactionCount.toString(),
      item.totalAmount.toLocaleString(),
      `${(item.commissionRate * 100).toFixed(2)}%`,
      item.finalCommission.toLocaleString()
    ])
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    return csvContent
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant='h6'>Loading commission history...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Commission History
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Historical commission calculations and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<Icon icon='tabler:refresh' />} onClick={fetchCommissionHistory}>
            Refresh
          </Button>
          <Button variant='contained' startIcon={<Icon icon='tabler:download' />} onClick={handleExport}>
            Export CSV
          </Button>
        </Box>
      </Box>

      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='primary.main' sx={{ mb: 1 }}>
                {summary.totalRecords || 0}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='success.main' sx={{ mb: 1 }}>
                TZS {(summary.totalCommission || 0).toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='info.main' sx={{ mb: 1 }}>
                {summary.totalTransactions || 0}
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
                TZS {(summary.avgCommission || 0).toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Average Commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 6 }}>
        <CardHeader title='Filters' />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Period'
                placeholder='YYYY-MM (e.g., 2026-01)'
                value={filters.period}
                onChange={e => setFilters({ ...filters, period: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={filters.agentType}
                  label='Agent Type'
                  onChange={e => setFilters({ ...filters, agentType: e.target.value })}
                >
                  <MenuItem value=''>All Types</MenuItem>
                  <MenuItem value='super_agent'>Super Agent</MenuItem>
                  <MenuItem value='franchise'>Franchise</MenuItem>
                  <MenuItem value='local_agent'>Local Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
                <Button variant='outlined' onClick={() => setFilters({ period: '2026-01', agentType: '' })}>
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title='Commission History'
          action={
            <Typography variant='body2' color='text.secondary'>
              {commissionData.length} records found
            </Typography>
          }
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align='right'>Period</TableCell>
                  <TableCell align='right'>Transactions</TableCell>
                  <TableCell align='right'>Total Amount</TableCell>
                  <TableCell align='right'>Commission Rate</TableCell>
                  <TableCell align='right'>Final Commission</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissionData.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {item.agentName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {item.accountNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.agentType.replace('_', ' ').toUpperCase()}
                        size='small'
                        color={getAgentTypeColor(item.agentType) as any}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell align='right'>{item.period}</TableCell>
                    <TableCell align='right'>{item.transactionCount}</TableCell>
                    <TableCell align='right'>TZS {item.totalAmount.toLocaleString()}</TableCell>
                    <TableCell align='right'>{(item.commissionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight='medium' color='success.main'>
                        TZS {item.finalCommission.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {commissionData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No commission data found for the selected filters
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

CommissionHistory.acl = {
  action: 'read',
  subject: 'commissions'
}

export default CommissionHistory
