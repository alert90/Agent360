// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'
import Link from 'next/link'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import TableContainer from '@mui/material/TableContainer'
import TableCell, { TableCellBaseProps } from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

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

const MUITableCell = styled(TableCell)<TableCellBaseProps>(({ theme }) => ({
  borderBottom: 0,
  paddingLeft: '0 !important',
  paddingRight: '0 !important',
  '&:not(:last-child)': {
    paddingRight: `${theme.spacing(2)} !important`
  }
}))

const CalcWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const TransactionInvoice = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

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
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
      <Box sx={{ p: 5 }}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button variant='outlined' onClick={() => router.back()}>
              Go Back
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (!transactionDetail) {
    return (
      <Box sx={{ p: 5 }}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Alert severity='warning'>
              Transaction with ID: {id} does not exist. Please check the list of transactions:{' '}
              <Link href='/transactions/list' style={{ textDecoration: 'none' }}>
                Transaction List
              </Link>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const { transaction, customer, agent, financial, details, commissionBreakdown, relatedTransactions } =
    transactionDetail

  // Ensure commissionBreakdown has default values if undefined
  const safeCommissionBreakdown = commissionBreakdown || {
    type: 'local_agent',
    description: 'Direct commission on transaction',
    rate: '5%',
    amount: financial?.commissionAmount || 0
  }

  return (
    <Box sx={{ p: 6 }}>
      {/* Header Actions */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Transaction
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Transaction Reference: {transaction?.id || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' startIcon={<Icon icon='tabler:printer' />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant='outlined' startIcon={<Icon icon='tabler:arrow-left' />} onClick={() => router.back()}>
            Back
          </Button>
        </Box>
      </Box>

      {/* Invoice Card */}
      <Card>
        <CardContent sx={{ p: [`${theme.spacing(6)} !important`, `${theme.spacing(10)} !important`] }}>
          {/* Header with Logo and Transaction ID */}
          <Grid container alignItems='center'>
            <Grid item sm={6} xs={12} sx={{ mb: { sm: 0, xs: 4 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img src='/images/crdblogo.png' alt='Logo' style={{ height: 40, width: 'auto' }} />
                </Box>
              </Box>
            </Grid>
            <Grid item sm={6} xs={12}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Table sx={{ maxWidth: '280px' }}>
                  <TableBody sx={{ '& .MuiTableCell-root': { py: `${theme.spacing(1.5)} !important` } }}>
                    <TableRow>
                      <MUITableCell>
                        <Typography variant='h5'>Transaction</Typography>
                      </MUITableCell>
                      <MUITableCell sx={{ textAlign: 'right' }}>
                        <Typography variant='h5'>{`#${transaction?.id?.substring(0, 8) || 'N/A'}...`}</Typography>
                      </MUITableCell>
                    </TableRow>
                    <TableRow>
                      <MUITableCell>
                        <Typography sx={{ color: 'text.secondary' }}>Date:</Typography>
                      </MUITableCell>
                      <MUITableCell sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: 'text.secondary' }}>{transaction?.date || 'N/A'}</Typography>
                      </MUITableCell>
                    </TableRow>
                    <TableRow>
                      <MUITableCell>
                        <Typography sx={{ color: 'text.secondary' }}>Type:</Typography>
                      </MUITableCell>
                      <MUITableCell sx={{ textAlign: 'right' }}>
                        <Chip
                          label={transaction?.type?.toUpperCase() || 'UNKNOWN'}
                          color={getTypeColor(transaction?.type || 'transfer') as any}
                          size='small'
                          variant='outlined'
                          sx={{ fontWeight: 500 }}
                        />
                      </MUITableCell>
                    </TableRow>
                    <TableRow>
                      <MUITableCell>
                        <Typography sx={{ color: 'text.secondary' }}>Channel:</Typography>
                      </MUITableCell>
                      <MUITableCell sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {transaction?.channel || 'N/A'}
                        </Typography>
                      </MUITableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        {/* Customer and Agent Information - Both with same clean style */}
        <CardContent sx={{ p: [`${theme.spacing(6)} !important`, `${theme.spacing(10)} !important`] }}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Name
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500 }}>
                    {customer?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Account Number
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {customer?.account || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Phone
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500 }}>
                    {customer?.phone || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Agent Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Name
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500 }}>
                    {agent?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Account Number
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {agent?.account || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Branch
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500 }}>
                    {agent?.branch || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Type
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={agent?.type?.replace('_', ' ').toUpperCase() || 'LOCAL AGENT'}
                      size='small'
                      color='primary'
                      variant='outlined'
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Box>
                {agent?.parentAgent && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant='subtitle2' sx={{ mb: 2, color: 'text.secondary' }}>
                      Parent Agent
                    </Typography>
                    <Box>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                        Name
                      </Typography>
                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                        {agent.parentAgent.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                        Account Number
                      </Typography>
                      <Typography variant='body2' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {agent.parentAgent.account}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        {/* Summary Section - Without Subtotal */}
        <CardContent sx={{ p: [`${theme.spacing(6)} !important`, `${theme.spacing(10)} !important`] }}>
          <Grid container>
            <Grid item xs={12} sm={7} lg={8} sx={{ order: { sm: 1, xs: 2 } }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary', minWidth: '80px' }}>
                  Reference:
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontFamily: 'monospace', fontWeight: 500 }}>
                  {details?.reference || transaction?.id || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary', minWidth: '80px' }}>
                  Initiated By:
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {details?.initiatedBy || 'customer'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>Narration:</Typography>
                <Typography sx={{ color: 'text.secondary', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                  {details?.narration || 'No narration'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={5} lg={4} sx={{ mb: { sm: 0, xs: 4 }, order: { sm: 2, xs: 1 } }}>
              <Card variant='outlined' sx={{ p: 3 }}>
                <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
                  Transaction Summary
                </Typography>
                <CalcWrapper>
                  <Typography sx={{ color: 'text.secondary' }}>Amount:</Typography>
                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {formatCurrency(financial?.amount || 0)}
                  </Typography>
                </CalcWrapper>
                {(financial?.fee || 0) > 0 && (
                  <CalcWrapper>
                    <Typography sx={{ color: 'text.secondary' }}>Fee:</Typography>
                    <Typography sx={{ fontWeight: 500, color: 'error.main' }}>
                      -{formatCurrency(financial?.fee || 0)}
                    </Typography>
                  </CalcWrapper>
                )}
                <Divider sx={{ my: 2 }} />
                <CalcWrapper>
                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Net Amount:</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1rem' }}>
                    {formatCurrency(financial?.netAmount || 0)}
                  </Typography>
                </CalcWrapper>
                <Divider sx={{ my: 2 }} />
                <CalcWrapper>
                  <Typography sx={{ color: 'text.secondary' }}>Commission ({safeCommissionBreakdown.rate}):</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'success.main', fontSize: '1.1rem' }}>
                    {formatCurrency(financial?.commissionAmount || 0)}
                  </Typography>
                </CalcWrapper>
              </Card>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        {/* Footer Note */}
        <CardContent sx={{ px: [6, 10] }}>
          <Grid container justifyContent='space-between' alignItems='center'>
            <Grid item>
              <Typography sx={{ color: 'text.secondary' }}>
                <Typography component='span' sx={{ mr: 1.5, fontWeight: 500, color: 'inherit' }}>
                  Location:
                </Typography>
                {transaction?.location || 'N/A'}, {transaction?.zone || 'N/A'}
              </Typography>
            </Grid>
            <Grid item>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Internal ID: {transaction?.internalId || 'N/A'} |{' '}
                {new Date(transactionDetail.metadata?.createdAt || new Date()).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

TransactionInvoice.acl = {
  action: 'read',
  subject: 'transactions'
}

export default TransactionInvoice
