import React, { useState, useEffect } from 'react'
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
  TextField,
  InputAdornment,
  Button,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import type { SelectChangeEvent } from '@mui/material'

interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  totalCommission: number
  avgTransactionAmount: number
}

const TransactionList = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  })
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    avgTransactionAmount: 0
  })

  const fetchTransactions = async (page = 0, pageSize = 25, newFilters = filters) => {
    try {
      setLoading(true)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
        search: newFilters.search,
        type: newFilters.type,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      })

      if (newFilters.startDate) {
        queryParams.append('startDate', newFilters.startDate)
      }
      if (newFilters.endDate) {
        queryParams.append('endDate', newFilters.endDate)
      }

      const response = await fetch(`/api/transactions/list?${queryParams}`, {
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
        setPagination({
          page: result.pagination.page - 1,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        })
        setStats(result.stats)
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
    fetchTransactions()
  }, [user])

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
    // Export to CSV (removed status column)
    const headers = [
      'Transaction ID',
      'Agent Name',
      'Customer Name',
      'Type',
      'Amount',
      'Commission',
      'Date',
      'Location'
    ]

    const csvData = data.map(tx => [
      tx.transactionId || '',
      tx.agentName || '',
      tx.customerName || '',
      tx.type || '',
      tx.amount || 0,
      tx.commissionAmount || 0,
      tx.timestamp || '',
      tx.location || ''
    ])

    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')

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

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchTransactions(0, pagination.pageSize, updatedFilters)
  }

  // Transaction columns for data table (removed status column)
  const columns: GridColDef[] = [
    {
      field: 'transactionId',
      headerName: 'Transaction ID',
      minWidth: 150,
      renderCell: ({ row }) => (
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
          {row.transactionId}
        </Typography>
      )
    },
    {
      field: 'agentName',
      headerName: 'Agent',
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.agentName}</Typography>
          <Typography variant='body2' sx={{ color: 'text.disabled' }}>
            {row.agentId}
          </Typography>
        </Box>
      )
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.customerName}</Typography>
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
      minWidth: 100,
      renderCell: ({ row }) => {
        const typeColors: Record<string, any> = {
          deposit: 'success',
          withdrawal: 'error',
          transfer: 'info',
          payment: 'primary'
        }
        const color = typeColors[row.type] || 'default'

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
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography variant='body2' fontWeight='bold'>
          {formatCurrency(row.amount || 0)}
        </Typography>
      )
    },
    {
      field: 'commissionAmount',
      headerName: 'Commission',
      type: 'number',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography variant='body2' color='success.main'>
          {formatCurrency(row.commissionAmount || 0)}
        </Typography>
      )
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography sx={{ color: 'text.secondary' }}>
          {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    },
    {
      field: 'location',
      headerName: 'Location',
      minWidth: 120,
      renderCell: ({ row }) => <Typography sx={{ color: 'text.secondary' }}>{row.location || 'N/A'}</Typography>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='View Invoice'>
            <IconButton size='small' onClick={() => handleViewDetails(row.transactionId)} color='primary'>
              <Icon icon='tabler:file-invoice' fontSize={20} />
            </IconButton>
          </Tooltip>
        </Box>
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
            Manage and view all transaction records
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

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 3 }}>
            Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder='Search by Transaction ID, Agent Name, Customer Name...'
                value={filters.search}
                onChange={e => handleFilterChange({ search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='tabler:search' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filters.type}
                  label='Transaction Type'
                  onChange={e => handleFilterChange({ type: e.target.value })}
                >
                  <MenuItem value='all'>All Types</MenuItem>
                  <MenuItem value='deposit'>Deposit</MenuItem>
                  <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                  <MenuItem value='transfer'>Transfer</MenuItem>
                  <MenuItem value='payment'>Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
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
            page: pagination.page,
            pageSize: pagination.pageSize
          }}
          onPaginationModelChange={model => {
            setPagination(prev => ({ ...prev, page: model.page, pageSize: model.pageSize }))
            fetchTransactions(model.page, model.pageSize, filters)
          }}
          rowCount={pagination.total}
          paginationMode='server'
          sortingMode='server'
          getRowId={row => row.id || row.transactionId}
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

// ** ACL Configuration - Allow authenticated users to view transactions
;(TransactionList as any).acl = {
  action: 'read',
  subject: 'transactions'
}

export default TransactionList
