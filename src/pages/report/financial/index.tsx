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

interface TransactionReport {
  id: number
  transaction_id: string
  agent_id: string
  agent_name: string
  agent_type: string
  customer_name: string
  amount: number
  fee: number
  net_amount: number
  commission_amount: number
  status: string
  location: string
  timestamp: string
}

interface FinancialSummary {
  totalTransactions: number
  totalAmount: number
  totalFees: number
  totalNetAmount: number
  totalCommission: number
  avgTransaction: number
  topTransaction: TransactionReport | null
  superAgentCount: number
  franchiseCount: number
  localAgentCount: number
}

const FinancialReport = () => {
  const [transactions, setTransactions] = useState<TransactionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('timestamp')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchTransactionData()
  }, [])

  const fetchTransactionData = async () => {
    try {
      const response = await fetch('/api/transactions/report')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        const matchesSearch =
          transaction.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = selectedType === 'all' || transaction.agent_type === selectedType
        const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus

        return matchesSearch && matchesType && matchesStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount':
            return b.amount - a.amount
          case 'timestamp':
          default:
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        }
      })
  }, [transactions, searchTerm, selectedType, selectedStatus, sortBy])

  const summary = useMemo((): FinancialSummary => {
    const filtered = filteredAndSortedTransactions
    const totalTransactions = filtered.length
    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0)
    const totalFees = filtered.reduce((sum, t) => sum + t.fee, 0)
    const totalNetAmount = filtered.reduce((sum, t) => sum + t.net_amount, 0)
    const totalCommission = filtered.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0

    const topTransaction =
      totalTransactions > 0 ? filtered.reduce((best, current) => (current.amount > best.amount ? current : best)) : null

    const superAgentCount = filtered.filter(t => t.agent_type === 'super_agent').length
    const franchiseCount = filtered.filter(t => t.agent_type === 'franchise').length
    const localAgentCount = filtered.filter(t => t.agent_type === 'local_agent').length

    return {
      totalTransactions,
      totalAmount,
      totalFees,
      totalNetAmount,
      totalCommission,
      avgTransaction,
      topTransaction,
      superAgentCount,
      franchiseCount,
      localAgentCount
    }
  }, [filteredAndSortedTransactions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
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
      'Transaction ID',
      'Agent Name',
      'Agent Type',
      'Customer Name',
      'Amount',
      'Fee',
      'Net Amount',
      'Commission',
      'Status',
      'Location',
      'Date'
    ]

    const csvData = filteredAndSortedTransactions.map(t => [
      t.transaction_id,
      t.agent_name,
      t.agent_type.replace('_', ' ').toUpperCase(),
      t.customer_name,
      t.amount.toLocaleString(),
      t.fee.toLocaleString(),
      t.net_amount.toLocaleString(),
      (t.commission_amount || 0).toLocaleString(),
      t.status,
      t.location,
      t.timestamp
    ])

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading financial data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Financial Transaction Report
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Detailed transaction analysis and financial metrics
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Icon icon='tabler:download' />}
          onClick={exportToCSV}
          disabled={filteredAndSortedTransactions.length === 0}
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
                TZS {summary.totalNetAmount.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Net Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='warning.main' sx={{ mb: 1 }}>
                TZS {summary.totalCommission.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label='Search'
                placeholder='Search transactions...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Icon icon='tabler:search' style={{ marginRight: 8 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={selectedStatus} label='Status' onChange={e => setSelectedStatus(e.target.value)}>
                  <MenuItem value='all'>All Status</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='failed'>Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} label='Sort By' onChange={e => setSortBy(e.target.value)}>
                  <MenuItem value='timestamp'>Date</MenuItem>
                  <MenuItem value='amount'>Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1 }}>
                <Chip label={`${summary.superAgentCount} SA`} color='primary' size='small' variant='outlined' />
                <Chip label={`${summary.franchiseCount} FR`} color='secondary' size='small' variant='outlined' />
                <Chip label={`${summary.localAgentCount} LA`} color='default' size='small' variant='outlined' />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Transaction Card */}
      {summary.topTransaction && (
        <Card sx={{ mb: 6 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon='tabler:coin' color='success' style={{ fontSize: 32 }} />
              <Box>
                <Typography variant='h6' color='success.main'>
                  Largest Transaction
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  TZS {summary.topTransaction.amount.toLocaleString()}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {summary.topTransaction.agent_name} ({summary.topTransaction.transaction_id})
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {summary.topTransaction.customer_name} - {summary.topTransaction.timestamp}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader
          title='Transaction Details'
          subheader={`${filteredAndSortedTransactions.length} transactions found`}
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Agent Details</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                  <TableCell align='right'>Fee</TableCell>
                  <TableCell align='right'>Net Amount</TableCell>
                  <TableCell align='right'>Commission</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedTransactions.map(transaction => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                        {transaction.transaction_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {transaction.agent_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={transaction.agent_type.replace('_', ' ').toUpperCase()}
                            size='small'
                            color={getAgentTypeColor(transaction.agent_type) as any}
                            variant='outlined'
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{transaction.customer_name}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {transaction.location}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight='medium'>
                        TZS {transaction.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>TZS {transaction.fee.toLocaleString()}</TableCell>
                    <TableCell align='right'>TZS {transaction.net_amount.toLocaleString()}</TableCell>
                    <TableCell align='right'>TZS {(transaction.commission_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size='small'
                        color={getStatusColor(transaction.status) as any}
                        variant='filled'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{new Date(transaction.timestamp).toLocaleDateString()}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align='center' sx={{ py: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No transactions found for the selected criteria
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

FinancialReport.acl = {
  action: 'read',
  subject: 'reports'
}

export default FinancialReport
