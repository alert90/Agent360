// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import { SelectChangeEvent } from '@mui/material/Select'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Third Party Imports
import axios from 'axios'

// ** Types
import { InvoiceType } from 'src/types/apps/invoiceTypes'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'

interface Props {
  invoiceData: InvoiceType[]
}

interface AgentActivity {
  id: string
  type: 'transaction' | 'commission' | 'login' | 'status_change'
  description: string
  timestamp: string
  amount?: number
  customer_name?: string
}

interface Transaction {
  id: number
  transaction_id: string
  customer_name: string
  customer_phone?: string
  type: string
  amount: number
  commission_amount: number
  status: string
  timestamp: string
}

interface TransactionFilters {
  search: string
  type: string
  startDate: string
  endDate: string
  page: number
  limit: number
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
})

const AgentViewAccount = ({ invoiceData }: Props) => {
  // ** States
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  // ** Hooks
  const router = useRouter()
  const { user } = useAuth()

  // Fetch agent activities and transactions
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!router.isReady || !user) return

      setLoading(true)
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const { id } = router.query

        // Fetch agent activities (mock data for now - in real app this would come from API)
        const mockActivities: AgentActivity[] = [
          {
            id: '1',
            type: 'transaction',
            description: 'Processed mobile money transaction',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            amount: 50000,
            customer_name: 'John Doe'
          },
          {
            id: '2',
            type: 'commission',
            description: 'Commission earned from transaction',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            amount: 250
          },
          {
            id: '3',
            type: 'login',
            description: 'Agent logged into system',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'status_change',
            description: 'Agent status updated to active',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]

        // Fetch recent transactions with filters
        const queryParams = new URLSearchParams({
          page: filters.page.toString(),
          limit: filters.limit.toString(),
          ...(filters.search && { search: filters.search }),
          ...(filters.type && { type: filters.type }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate })
        })

        const response = await axios.get(`/api/agents/${id}/transactions?${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data.success) {
          setTransactions(response.data.data)
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages
          })
        }

        setActivities(mockActivities)
      } catch (error) {
        console.error('Error fetching agent activities:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [router.isReady, user, router.query, filters])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)

      return `${diffInDays} days ago`
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'tabler:arrows-left-right'
      case 'commission':
        return 'tabler:coin'
      case 'login':
        return 'tabler:login'
      case 'status_change':
        return 'tabler:settings'
      default:
        return 'tabler:activity'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'success'
      case 'commission':
        return 'warning'
      case 'login':
        return 'info'
      case 'status_change':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Agent Activity Timeline'
            action={
              <OptionsMenu
                options={['Refresh timeline', 'Export activities', 'Filter by date']}
                iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
              />
            }
          />
          <CardContent>
            <Timeline>
              {activities.map((activity, index) => (
                <TimelineItem key={activity.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getActivityColor(activity.type) as any} />
                    {index < activities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ mb: theme => `${theme.spacing(3)} !important` }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant='h6' sx={{ mr: 2 }}>
                        {activity.description}
                      </Typography>
                      <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ mb: 2 }}>
                      {activity.customer_name && `Customer: ${activity.customer_name}`}
                      {activity.amount && ` • Amount: ${formatCurrency(activity.amount)}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon
                        fontSize='1.25rem'
                        icon={getActivityIcon(activity.type)}
                        color={getActivityColor(activity.type) + '.main'}
                      />
                      <Typography variant='caption' sx={{ ml: 2, color: 'text.secondary' }}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Recent Transactions'
            action={
              <OptionsMenu
                options={['View all transactions', 'Export to CSV', 'Filter transactions']}
                iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
              />
            }
          />
          <CardContent>
            {/* Filter Controls */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label='Search'
                  placeholder='Customer name or phone...'
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon fontSize='1.25rem' icon='tabler:search' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    value={filters.type}
                    label='Transaction Type'
                    onChange={(e: SelectChangeEvent) =>
                      setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))
                    }
                  >
                    <MenuItem value=''>All Types</MenuItem>
                    <MenuItem value='MOBILE_MONEY'>Mobile Money</MenuItem>
                    <MenuItem value='BANK_TRANSFER'>Bank Transfer</MenuItem>
                    <MenuItem value='CASH_DEPOSIT'>Cash Deposit</MenuItem>
                    <MenuItem value='WITHDRAWAL'>Withdrawal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label='Start Date'
                  type='date'
                  value={filters.startDate}
                  onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label='End Date'
                  type='date'
                  value={filters.endDate}
                  onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Results Summary */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                Showing {transactions.length} of {pagination.total} transactions
              </Typography>
              <Button
                size='small'
                variant='outlined'
                onClick={() =>
                  setFilters({
                    search: '',
                    type: '',
                    startDate: '',
                    endDate: '',
                    page: 1,
                    limit: 10
                  })
                }
              >
                Clear Filters
              </Button>
            </Box>

            {transactions.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Transaction ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Commission</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {transaction.transaction_id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Box>
                            <Typography variant='body2' fontWeight='bold'>
                              {transaction.customer_name}
                            </Typography>
                            {transaction.customer_phone && (
                              <Typography variant='caption' color='text.secondary'>
                                {transaction.customer_phone}
                              </Typography>
                            )}
                          </Box>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography variant='body2'>{transaction.type}</Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant='body2' fontWeight='bold'>
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant='body2' color='success.main'>
                            {formatCurrency(transaction.commission_amount)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography
                            variant='body2'
                            sx={{
                              color: transaction.status === 'COMPLETED' ? 'success.main' : 'warning.main'
                            }}
                          >
                            {transaction.status}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography variant='body2'>{formatDate(transaction.timestamp)}</Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            ) : (
              <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                No recent transactions found
              </Typography>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={(event, page) => setFilters(prev => ({ ...prev, page }))}
                  color='primary'
                  size='small'
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AgentViewAccount
