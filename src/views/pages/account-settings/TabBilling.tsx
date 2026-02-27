// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Collapse,
  Alert,
  CircularProgress
} from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import axios from 'axios'
import toast from 'react-hot-toast'

interface ActivityItem {
  id: number
  type: string
  reference: string
  description: string
  created_at: string
  status: string
}

interface AccountItem {
  id: number
  account_number: string
  name: string
  type: string
  branch_name: string
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
}

const TabBilling = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/user/profile')
        setActivity(response.data.activity || [])
        setAccounts(response.data.accounts || [])
      } catch (error) {
        console.error('Error fetching user activity:', error)
        toast.error('Failed to load activity data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleRowToggle = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'tabler:credit-card'
      case 'login':
        return 'tabler:login'
      case 'password_change':
        return 'tabler:lock'
      case 'security_alert':
        return 'tabler:shield-x'
      default:
        return 'tabler:activity'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'primary'
      case 'login':
        return 'success'
      case 'password_change':
        return 'warning'
      case 'security_alert':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ mr: 4 }} />
                <Typography>Loading activity...</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      {/* Accounts Overview */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 4 }}>
              My Accounts ({accounts.length})
            </Typography>

            {accounts.length === 0 ? (
              <Alert severity='info'>No accounts found associated with your profile.</Alert>
            ) : (
              <Grid container spacing={3}>
                {accounts.map(account => (
                  <Grid item xs={12} sm={6} md={4} key={account.id}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Icon icon='tabler:building-bank' fontSize='1.25rem' />
                          </Avatar>
                          <Box>
                            <Typography variant='subtitle1' fontWeight={600}>
                              {account.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {account.account_number}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2' color='text.secondary'>
                            Type: {account.type}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Branch: {account.branch_name}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              Transactions: {account.transaction_count}
                            </Typography>
                            <Typography variant='body2' color='success.main'>
                              Commission: ${account.commission_amount.toFixed(2)}
                            </Typography>
                          </Box>
                          <Chip
                            label={account.type.replace('_', ' ')}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Activity History */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 4 }}>
              Activity History ({activity.length})
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activity.map(item => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              bgcolor: `${getActivityColor(item.type)}.main`,
                              width: 32,
                              height: 32
                            }}
                          >
                            <Icon icon={getActivityIcon(item.type)} fontSize='1rem' color='white' />
                          </Avatar>
                          <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                            {item.type.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{item.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' fontFamily='monospace'>
                          {item.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.status} color={getStatusColor(item.status)} size='small' />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{new Date(item.created_at).toLocaleDateString()}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(item.created_at).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size='small' onClick={() => handleRowToggle(item.id)}>
                          <Icon icon={expandedRows.has(item.id) ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        <Typography variant='body2' color='text.secondary' sx={{ py: 4 }}>
                          No activity found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TabBilling
