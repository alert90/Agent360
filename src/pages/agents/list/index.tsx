import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  IconButton,
  Tooltip,
  Link
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import axios from 'axios'
import type { SelectChangeEvent } from '@mui/material'

// ** Styled Components
const StyledChip = styled(Chip)(({ theme }) => ({
  '&.active': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white
  },
  '&.inactive': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white
  }
}))

interface Agent {
  id: number
  account_number: string
  name: string
  username: string
  email: string
  role: 'admin' | 'analyst' | 'agent' | 'super_agent' | 'franchise'
  type: string
  branch_code: string
  branch_name: string
  zone: string
  parent_agent_id?: number
  parent_name?: string
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  phone?: string
  contact?: string
  kpi_score?: number
  performance_rating?: number
  last_login?: string
}

interface Filters {
  types: string[]
}

interface AgentStats {
  totalAgents: number
  totalFranchise: number
  totalSuperAgents: number
  activeAgents: number
}

const AgentList = () => {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<Filters>({ types: [] })
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    totalFranchise: 0,
    totalSuperAgents: 0,
    activeAgents: 0
  })
  const [apiStats, setApiStats] = useState<AgentStats>({
    totalAgents: 0,
    totalFranchise: 0,
    totalSuperAgents: 0,
    activeAgents: 0
  })

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/agents/list', {
        params: {
          page,
          limit: rowsPerPage,
          search,
          type: selectedType,
          sortBy,
          sortOrder
        }
      })

      if (response.data.success) {
        setAgents(response.data.data)
        setTotal(response.data.pagination.total)
        setFilters(response.data.filters)
        if (response.data.stats) {
          setApiStats(response.data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, rowsPerPage, search, selectedType, sortBy, sortOrder])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleTypeChange = (event: SelectChangeEvent) => {
    setSelectedType(event.target.value)
    setPage(1)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Columns for DataGrid
  const columns: GridColDef[] = [
    {
      flex: 0.275,
      minWidth: 290,
      field: 'name',
      headerName: 'Agent Name',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
                onClick={() => {
                  // Navigate to agent view page
                  router.push(`/agents/view/${row.id}`)
                }}
              >
                {row.name}
              </Typography>
              <Typography noWrap variant='caption'>
                {row.account_number}
              </Typography>
              <Typography noWrap variant='caption' sx={{ color: 'text.secondary' }}>
                {row.branch_name}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      field: 'agent type',
      headerName: 'Type',
      type: 'name',
      renderCell: ({ row }: { row: Agent }) => <Typography variant='body2'>{row.type}</Typography>
    },
    {
      field: 'transaction_count',
      headerName: 'Transactions',
      type: 'number',
      minWidth: 120,
      renderCell: ({ row }: { row: Agent }) => (
        <Typography variant='body2'>{row.transaction_count?.toLocaleString()}</Typography>
      )
    },
    {
      field: 'total_transaction_amount',
      headerName: 'Total Amount',
      type: 'number',
      minWidth: 150,
      renderCell: ({ row }: { row: Agent }) => (
        <Typography variant='body2' fontWeight='bold'>
          {formatCurrency(row.total_transaction_amount)}
        </Typography>
      )
    },
    {
      field: 'commission_amount',
      headerName: 'Commission',
      type: 'number',
      minWidth: 120,
      renderCell: ({ row }: { row: Agent }) => (
        <Typography variant='body2' color='success.main'>
          {formatCurrency(row.commission_amount)}
        </Typography>
      )
    },
    {
      field: 'is_active',
      headerName: 'Status',
      minWidth: 100,
      renderCell: ({ row }: { row: Agent }) => (
        <StyledChip
          label={row.is_active ? 'Active' : 'Inactive'}
          size='small'
          className={row.is_active ? 'active' : 'inactive'}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 100,
      sortable: false,
      renderCell: ({ row }: { row: Agent }) => (
        <IconButton size='small' color='primary' onClick={() => router.push(`/agents/view/${row.id}`)}>
          <Icon icon='tabler:eye' />
        </IconButton>
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
          Agents
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Agents
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage and view all agent records
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title='Upload Agents'>
            <IconButton color='primary'>
              <Icon icon='tabler:upload' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Export CSV'>
            <IconButton color='secondary'>
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
                {apiStats.totalAgents.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='success.main'>
                {apiStats.totalFranchise.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Franchise
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='warning.main'>
                {apiStats.totalSuperAgents.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Super Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='info.main'>
                {apiStats.activeAgents.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Active Agents
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder='Search agents...'
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='tabler:search' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={selectedType} onChange={handleTypeChange}>
                  <MenuItem value=''>All Types</MenuItem>
                  {filters.types.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Rows per page'
                type='number'
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                inputProps={{ min: 10, max: 100 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <DataGrid
          autoHeight
          rows={agents}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          pagination
          loading={loading}
          paginationModel={{
            page: page - 1,
            pageSize: rowsPerPage
          }}
          onPaginationModelChange={model => {
            setPage(model.page + 1)
            setRowsPerPage(model.pageSize)
          }}
          onSortModelChange={model => {
            if (model.length > 0) {
              const sortField = model[0].field
              const sortDirection = model[0].sort

              // Map DataGrid field names to database column names
              const fieldMap: Record<string, string> = {
                name: 'name',
                'agent type': 'type',
                transaction_count: 'transaction_count',
                total_transaction_amount: 'total_transaction_amount',
                commission_amount: 'commission_amount',
                is_active: 'is_active'
              }

              setSortBy(fieldMap[sortField] || 'name')
              setSortOrder(sortDirection === 'asc' ? 'asc' : 'desc')
            }
          }}
          rowCount={total}
          paginationMode='server'
          sortingMode='server'
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

export default AgentList
