// src/views/transactions/TransactionList.tsx
import React, { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import type { SelectChangeEvent } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'

interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  totalCommission: number
  avgTransactionAmount: number
}

interface AgentFilter {
  value: string
  label: string
}

interface Transaction {
  id: number
  transactionId: string
  reference: string
  agentName: string
  amount: number
  type: string
  status: string
  timestamp: string
  narration: string
  location: string
  commissionAmount: number
  fee: number
  netAmount: number
  customerName: string
  customerAccount: string
}

interface Filters {
  search: string
  type: string
  status: string
  agent: string
  startDate: Date | null
  endDate: Date | null
  page: number
  limit: number
}

const TransactionList = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    avgTransactionAmount: 0
  })
  const [agentFilters, setAgentFilters] = useState<AgentFilter[]>([])
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    status: 'all',
    agent: 'all',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 25
  })

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.agent !== 'all' && { agent: filters.agent }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString().split('T')[0] }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString().split('T')[0] })
      })

      const response = await fetch(`/api/transactions/parsed-list?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setStats(result.stats)
        if (result.filters?.agents) {
          setAgentFilters(result.filters.agents)
        }
      } else {
        throw new Error(result.message || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, filters.page, filters.limit])

  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handleApplyFilters = () => {
    fetchTransactions()
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      agent: 'all',
      startDate: null,
      endDate: null,
      page: 1,
      limit: 25
    })
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const handleViewDetails = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`)
  }

  const handleExport = () => {
    const headers = [
      'Transaction ID',
      'Reference',
      'Agent Name',
      'Type',
      'Amount',
      'Commission',
      'Status',
      'Date',
      'Narration'
    ]

    const csvData = data.map(tx => [
      tx.transactionId || '',
      tx.reference || '',
      tx.agentName || '',
      tx.type || '',
      tx.amount || 0,
      tx.commissionAmount || 0,
      tx.status || '',
      tx.timestamp || '',
      tx.narration || ''
    ])

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = () => {
    router.push('/transactions/upload')
  }

  // Columns for data table
  const columns: GridColDef[] = [
    {
      field: 'reference',
      headerName: 'Reference',
      minWidth: 180,
      renderCell: ({ row }: { row: Transaction }) => (
        <Typography
          component='button'
          onClick={() => handleViewDetails(row.transactionId)}
          sx={{
            color: 'primary.main',
            fontWeight: 500,
            textDecoration: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {row.reference || row.transactionId}
        </Typography>
      )
    },
    {
      field: 'agentName',
      headerName: 'Agent',
      minWidth: 200,
      flex: 1,
      renderCell: ({ row }: { row: Transaction }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.agentName || 'N/A'}</Typography>
        </Box>
      )
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      minWidth: 150,
      renderCell: ({ row }: { row: Transaction }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.customerName || 'N/A'}</Typography>
          {row.customerAccount && (
            <Typography variant='body2' sx={{ color: 'text.disabled' }}>
              {row.customerAccount}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      minWidth: 120,
      renderCell: ({ row }: { row: Transaction }) => {
        const typeColors: Record<string, any> = {
          deposit: 'success',
          withdrawal: 'error',
          transfer: 'info',
          payment: 'primary'
        }
        const color = typeColors[row.type?.toLowerCase()] || 'default'

        return (
          <Chip
            label={row.type?.toUpperCase() || 'UNKNOWN'}
            size='small'
            color={color}
            sx={{ textTransform: 'capitalize' }}
          />
        )
      }
    },
    {
      field: 'amount',
      headerName: 'Amount',
      type: 'number',
      minWidth: 150,
      renderCell: ({ row }: { row: Transaction }) => (
        <Typography
          sx={{
            color: row.type?.toLowerCase() === 'withdrawal' ? 'error.main' : 'success.main',
            fontWeight: 600
          }}
        >
          {formatCurrency(row.amount || 0)}
        </Typography>
      )
    },
    {
      field: 'commissionAmount',
      headerName: 'Commission',
      type: 'number',
      minWidth: 120,
      renderCell: ({ row }: { row: Transaction }) => (
        <Typography sx={{ color: 'warning.main', fontWeight: 500 }}>
          {formatCurrency(row.commissionAmount || 0)}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      renderCell: ({ row }: { row: Transaction }) => {
        const statusColors: Record<string, any> = {
          completed: 'success',
          pending: 'warning',
          failed: 'error',
          cancelled: 'secondary'
        }
        const color = statusColors[row.status] || 'default'

        return (
          <Chip
            label={row.status?.toUpperCase() || 'COMPLETED'}
            size='small'
            color={color}
            sx={{ textTransform: 'capitalize' }}
          />
        )
      }
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      minWidth: 150,
      renderCell: ({ row }: { row: Transaction }) => (
        <Typography sx={{ color: 'text.secondary' }}>
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
        </Typography>
      )
    },
    {
      field: 'narration',
      headerName: 'Narration',
      minWidth: 250,
      flex: 2,
      renderCell: ({ row }: { row: Transaction }) => (
        <Typography sx={{ color: 'text.secondary' }}>
          {row.narration ? row.narration.substring(0, 50) + (row.narration.length > 50 ? '...' : '') : 'N/A'}
        </Typography>
      )
    }
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 4 }}>
        <Link href='/' style={{ textDecoration: 'none' }}>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Dashboard
          </Typography>
        </Link>
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          Transactions
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Transactions
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            View and manage parsed transaction records
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title='Upload Transactions'>
            <IconButton onClick={handleUpload} color='primary'>
              <Icon icon='tabler:upload' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Export CSV'>
            <IconButton onClick={handleExport} color='secondary'>
              <Icon icon='tabler:download' />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                {formatNumber(stats.totalTransactions)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='success.main'>
                {formatCurrency(stats.totalAmount)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='warning.main'>
                {formatCurrency(stats.totalCommission)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='info.main'>
                {formatCurrency(stats.avgTransactionAmount)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Average Transaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label='Search'
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
                placeholder='Search by reference, agent, or narration...'
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label='Type'
                  onChange={(e: SelectChangeEvent) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value='all'>All Types</MenuItem>
                  <MenuItem value='deposit'>Deposit</MenuItem>
                  <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                  <MenuItem value='transfer'>Transfer</MenuItem>
                  <MenuItem value='payment'>Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={filters.agent}
                  label='Agent'
                  onChange={(e: SelectChangeEvent) => handleFilterChange('agent', e.target.value)}
                >
                  <MenuItem value='all'>All Agents</MenuItem>
                  {agentFilters.map(agent => (
                    <MenuItem key={agent.value} value={agent.value}>
                      {agent.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='date'
                label='Start Date'
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='date'
                label='End Date'
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                <Button variant='contained' onClick={handleApplyFilters} fullWidth>
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant='outlined' onClick={handleClearFilters} startIcon={<Icon icon='tabler:filter-off' />}>
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <DataGrid
          autoHeight
          rows={data}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          pagination
          loading={loading}
          paginationModel={{
            page: filters.page - 1,
            pageSize: filters.limit
          }}
          onPaginationModelChange={model => {
            handleFilterChange('page', model.page + 1)
            handleFilterChange('limit', model.pageSize)
          }}
          rowCount={stats.totalTransactions}
          paginationMode='server'
          sx={{
            '& .MuiSvgIcon-root': {
              fontSize: '1.125rem'
            }
          }}
        />
      </Card>
    </Box>
  )
}

// ** ACL Configuration
TransactionList.acl = {
  action: 'read',
  subject: 'transactions'
}

export default TransactionList
