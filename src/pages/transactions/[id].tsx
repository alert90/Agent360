// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
interface TransactionDetail {
  transaction: {
    id: string
    internalId: number
    date: string
    status: string
    type: string
    channel: string
    location: string
    zone: string
  }
  customer: {
    name: string
    account: string
    phone: string
  }
  agent: {
    id: number
    name: string
    account: string
    type: string
    branch: string
    parentAgent?: {
      name: string
      account: string
    }
  }
  financial: {
    amount: number
    fee: number
    netAmount: number
    commissionAmount: number
    commissionEligible: boolean
  }
  details: {
    narration: string
    reference: string
    initiatedBy: string
  }
  commissionBreakdown: {
    type: string
    description: string
    rate: string
    amount: number
  }
  relatedTransactions: Array<{
    id: number
    agent: string
    account: string
    amount: number
    commission: number
  }>
  metadata: {
    createdAt: string
    updatedAt: string
  }
}

const TransactionInvoice = () => {
  const router = useRouter()
  const { id } = router.query

  const [transactionDetail, setTransactionDetail] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchTransactionDetail(id)
    }
  }, [id])

  const fetchTransactionDetail = async (transactionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/transactions/${transactionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details')
      }

      const result = await response.json()
      if (result.success) {
        setTransactionDetail(result.data)
      } else {
        throw new Error(result.message || 'Failed to load transaction')
      }
    } catch (err) {
      console.error('Error fetching transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transaction')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'success'
      case 'withdrawal':
        return 'error'
      case 'transfer':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant='outlined' onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  if (!transactionDetail) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>Transaction not found</Alert>
      </Box>
    )
  }

  const { transaction, customer, agent, financial, details, commissionBreakdown, relatedTransactions } =
    transactionDetail

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Transaction Invoice
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Transaction ID: {transaction.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' onClick={() => window.print()}>
            <Icon icon='tabler:printer' fontSize='1.25rem' style={{ marginRight: 8 }} />
            Print
          </Button>
          <Button variant='outlined' onClick={() => router.back()}>
            <Icon icon='tabler:arrow-left' fontSize='1.25rem' style={{ marginRight: 8 }} />
            Back
          </Button>
        </Box>
      </Box>

      {/* Invoice Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h5'>Agent360 Transaction Receipt</Typography>
              <Chip
                label={transaction.status.toUpperCase()}
                color={getStatusColor(transaction.status) as any}
                size='small'
              />
            </Box>
          }
          subheader={`Transaction Date: ${transaction.date}`}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Transaction Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Transaction ID:
                  </Typography>
                  <Typography variant='body2' fontWeight='medium'>
                    {transaction.id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Type:
                  </Typography>
                  <Chip
                    label={transaction.type.toUpperCase()}
                    color={getTypeColor(transaction.type) as any}
                    size='small'
                    variant='outlined'
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Channel:
                  </Typography>
                  <Typography variant='body2'>{transaction.channel}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Location:
                  </Typography>
                  <Typography variant='body2'>
                    {transaction.location}, {transaction.zone}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Name:
                  </Typography>
                  <Typography variant='body2'>{customer.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Account:
                  </Typography>
                  <Typography variant='body2'>{customer.account}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Phone:
                  </Typography>
                  <Typography variant='body2'>{customer.phone}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Agent Information */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='Agent Information' />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Agent Name:
                  </Typography>
                  <Typography variant='body2'>{agent.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Account Number:
                  </Typography>
                  <Typography variant='body2'>{agent.account}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Type:
                  </Typography>
                  <Chip
                    label={agent.type.replace('_', ' ').toUpperCase()}
                    color='primary'
                    size='small'
                    variant='outlined'
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Branch:
                  </Typography>
                  <Typography variant='body2'>{agent.branch}</Typography>
                </Box>
              </Box>
            </Grid>

            {agent.parentAgent && (
              <Grid item xs={12} md={6}>
                <Typography variant='h6' gutterBottom>
                  Parent Agent
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      Name:
                    </Typography>
                    <Typography variant='body2'>{agent.parentAgent.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      Account:
                    </Typography>
                    <Typography variant='body2'>{agent.parentAgent.account}</Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='Transaction Summary' />
        <CardContent>
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      Transaction Amount
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {formatCurrency(financial.amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
                {financial.fee > 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        Fee
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' color='text.secondary'>
                        -{formatCurrency(financial.fee)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      Net Amount
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2'>{formatCurrency(financial.netAmount)}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ borderTop: 1, borderTopColor: 'divider' }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      Commission ({commissionBreakdown.rate})
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {commissionBreakdown.description}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color='success.main' fontWeight='medium'>
                      {formatCurrency(financial.commissionAmount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='Transaction Details' />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Narration
              </Typography>
              <Typography variant='body1'>{details.narration || 'N/A'}</Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Reference
              </Typography>
              <Typography variant='body1'>{details.reference || 'N/A'}</Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Initiated By
              </Typography>
              <Typography variant='body1'>{details.initiatedBy}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Related Transactions */}
      {relatedTransactions.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title='Related Transactions' />
          <CardContent>
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableRow>
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      Agent
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      Account
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      Amount
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      Commission
                    </Typography>
                  </TableCell>
                </TableRow>
                {relatedTransactions.map((rt, index) => (
                  <TableRow key={rt.id}>
                    <TableCell>
                      <Typography variant='body2'>{rt.agent}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{rt.account}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{formatCurrency(rt.amount)}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' color='success.main'>
                        {formatCurrency(rt.commission)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant='body2' color='text.secondary'>
          This is an official Agent360 transaction receipt. Generated on {new Date().toLocaleDateString()}
        </Typography>
        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
          Internal ID: {transaction.internalId} | Created:{' '}
          {new Date(transactionDetail.metadata.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  )
}

TransactionInvoice.acl = {
  action: 'read',
  subject: 'transactions'
}

export default TransactionInvoice
