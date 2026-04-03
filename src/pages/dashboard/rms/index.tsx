import React, { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, Button, CircularProgress, Chip, IconButton } from '@mui/material'
import { styled } from '@mui/material/styles'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import axios from 'axios'

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

interface SystemStats {
  totalAgents: number
  franchiseAgents: number
  superAgents: number
  transactions: number
  totalAmount: number
  totalCommission: number
  avgTransactionAmount: number
}

interface TopAgent {
  id: number
  name: string
  account_number: string
  branch_name: string
  type: string
  transaction_count: number
  total_transaction_amount: number
  commission_amount: number
  is_active: boolean
}

const RmsDashboard = () => {
  const router = useRouter()
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalAgents: 0,
    franchiseAgents: 0,
    superAgents: 0,
    transactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    avgTransactionAmount: 0
  })
  const [topAgents, setTopAgents] = useState<TopAgent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch system stats from transactions API
      const token = localStorage.getItem('accessToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const agentsResponse = await axios.get('/api/agents/list', {
        headers,
        params: { page: 1, limit: 1 }
      })

      if (agentsResponse.data.success) {
        setSystemStats(prev => ({
          ...prev,
          totalAgents: agentsResponse.data.stats?.totalAgents || 0,
          franchiseAgents: agentsResponse.data.stats?.totalFranchise || 0,
          superAgents: agentsResponse.data.stats?.totalSuperAgents || 0
        }))
      }

      const statsResponse = await axios.get('/api/transactions/list', {
        headers: headers,
        params: {
          page: 1,
          limit: 1
        }
      })

      if (statsResponse.data.success) {
        const stats = statsResponse.data.stats
        setSystemStats(prev => ({
          ...prev,
          transactions: stats.totalTransactions || 0,
          totalAmount: stats.totalAmount || 0,
          totalCommission: stats.totalCommission || 0,
          avgTransactionAmount: stats.avgTransactionAmount || 0
        }))
      }

      const topAgentsResponse = await axios.get('/api/agents/list', {
        params: { page: 1, limit: 50, sortBy: 'transaction_count', sortOrder: 'desc' }
      })

      if (topAgentsResponse.data.success) {
        const sortedAgents = topAgentsResponse.data.data
          .sort((a: TopAgent, b: TopAgent) => b.transaction_count - a.transaction_count)
          .slice(0, 10)
        setTopAgents(sortedAgents)
      }
    } catch (error) {
      console.error('Failed to fetch rms dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(amount)
      .replace('TZS', '')
      .trim()
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
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
          RMS Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Performance analytics and agents insights
        </Typography>
      </Grid>
      {/* Key Metrics with Tabs */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
            <Icon icon='tabler:users' fontSize='3rem' color='#1976d2' /> {/* Primary Blue */}
            <Typography variant='h3'>{systemStats.totalAgents.toLocaleString()}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Agents
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
            <Icon icon='tabler:building-store' fontSize='3rem' color='#2e7d32' /> {/* Success Green */}
            <Typography variant='h3'>{systemStats.franchiseAgents.toLocaleString()}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Franchise Agents
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
            <Icon icon='tabler:star' fontSize='3rem' color='#ed6c02' /> {/* Warning Orange */}
            <Typography variant='h3'>{systemStats.superAgents.toLocaleString()}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Super Agents
            </Typography>
          </Box>
        </Grid>
      </Grid>
      {/* Other Key Metrics */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:receipt' fontSize='2rem' color='success' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatNumber(systemStats.transactions)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Transactions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:currency-dollar' fontSize='2rem' color='warning' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatCurrency(systemStats.totalAmount)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      {/* <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:chart-line' fontSize='2rem' color='info' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatCurrency(systemStats.totalCommission)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Commission
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid> */}
      {/* Top Performing Agents */}
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
                  flex: 0.25,
                  minWidth: 200,
                  field: 'name',
                  headerName: 'Agent Name',
                  renderCell: (params: any) => {
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
                  field: 'type',
                  headerName: 'Type',
                  minWidth: 100,
                  renderCell: ({ row }: any) => <Typography variant='body2'>{row.type}</Typography>
                },
                {
                  field: 'transaction_count',
                  headerName: 'Transactions',
                  type: 'number',
                  minWidth: 120,
                  renderCell: ({ row }: any) => (
                    <Typography variant='body2'>{row.transaction_count?.toLocaleString()}</Typography>
                  )
                },
                {
                  field: 'total_transaction_amount',
                  headerName: 'Total Amount',
                  type: 'number',
                  minWidth: 150,
                  renderCell: ({ row }: any) => (
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
                  renderCell: ({ row }: any) => (
                    <Typography variant='body2' color='success.main'>
                      {formatCurrency(row.commission_amount)}
                    </Typography>
                  )
                },
                {
                  field: 'is_active',
                  headerName: 'Status',
                  minWidth: 100,
                  renderCell: ({ row }: any) => (
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
                  renderCell: ({ row }: any) => (
                    <IconButton size='small' color='primary' onClick={() => router.push(`/agents/view/${row.id}`)}>
                      <Icon icon='tabler:eye' />
                    </IconButton>
                  )
                }
              ]}
              pageSizeOptions={[10, 25, 50, 100]}
              pagination
              loading={loading}
              paginationModel={{
                page: 0,
                pageSize: 10
              }}
              rowCount={topAgents.length}
              paginationMode='client'
              sortingMode='client'
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.125rem'
                }
              }}
            />
          </CardContent>
        </Card>
      </Grid>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:download' />}
                  href='/commission/report'
                >
                  Commission Report
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant='outlined' startIcon={<Icon icon='tabler:users' />} href='/agents/list'>
                  Manage Agents
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:upload' />}
                  href='/streaming-upload-demo'
                >
                  Upload Data
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:refresh' />}
                  onClick={fetchDashboardData}
                >
                  Refresh Data
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

// ** ACL Configuration - RMS can read analytics
RmsDashboard.acl = {
  action: 'read',
  subject: 'analytics'
}

export default RmsDashboard
