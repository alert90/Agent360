// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface TransactionOverviewData {
  totalTransactions: number
  totalAmount: number
  creditAmount: number
  debitAmount: number
  completedTransactions: number
  pendingTransactions: number
}

const AnalyticsTransactionVisits = () => {
  // ** State
  const [data, setData] = useState<TransactionOverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/analytics')
        setData(response.data.transactionOverview)
      } catch (error) {
        console.error('Error fetching transaction overview:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <Card>
        <CardContent sx={{ p: theme => `${theme.spacing(5)} !important` }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography>Loading...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Calculate percentages and progress
  const debitPercentage = data.totalAmount > 0 ? (data.debitAmount / data.totalAmount) * 100 : 0
  const creditPercentage = data.totalAmount > 0 ? (data.creditAmount / data.totalAmount) * 100 : 0
  const completionRate = data.totalTransactions > 0 ? (data.completedTransactions / data.totalTransactions) * 100 : 0

  // Format large numbers
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `TZS ${(amount / 1000000000).toFixed(1)} B`
    if (amount >= 1000000) return `TZS ${(amount / 1000000).toFixed(1)} M`
    if (amount >= 1000) return `TZS ${(amount / 1000).toFixed(1)} K`

    return `TZS ${amount.toLocaleString()}`
  }

  return (
    <Card>
      <CardContent sx={{ p: theme => `${theme.spacing(5)} !important` }}>
        <Box sx={{ gap: 2, mb: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Typography variant='body2' sx={{ color: 'text.disabled' }}>
              Transactions Overview
            </Typography>
            <Typography variant='h4'>{formatAmount(data.totalAmount)}</Typography>
          </div>
          <Typography sx={{ fontWeight: 500, color: 'success.main' }}>+{completionRate.toFixed(1)}%</Typography>
        </Box>
        <Box sx={{ mb: 3.5, gap: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ py: 2.25, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
              <CustomAvatar skin='light' color='error' variant='rounded' sx={{ mr: 1.5, height: 24, width: 24 }}>
                <Icon icon='tabler:minus' fontSize='1.125rem' />
              </CustomAvatar>
              <Typography sx={{ color: 'text.secondary' }}>Debit</Typography>
            </Box>
            <Typography variant='h5'>{debitPercentage.toFixed(1)}%</Typography>
            <Typography variant='body2' sx={{ color: 'text.disabled' }}>
              {formatAmount(data.debitAmount)}
            </Typography>
          </Box>
          <Divider flexItem sx={{ m: 0 }} orientation='vertical'>
            <CustomAvatar
              skin='light'
              color='secondary'
              sx={{ height: 24, width: 24, fontSize: '0.6875rem', color: 'text.secondary' }}
            >
              VS
            </CustomAvatar>
          </Divider>
          <Box sx={{ py: 2.25, display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
            <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 1.5, color: 'text.secondary' }}>Credit</Typography>
              <CustomAvatar skin='light' color='success' variant='rounded' sx={{ height: 24, width: 24 }}>
                <Icon icon='tabler:plus' fontSize='1.125rem' />
              </CustomAvatar>
            </Box>
            <Typography variant='h5'>{creditPercentage.toFixed(1)}%</Typography>
            <Typography variant='body2' sx={{ color: 'text.disabled' }}>
              {formatAmount(data.creditAmount)}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          value={completionRate}
          color='success'
          variant='determinate'
          sx={{
            height: 10,
            '&.MuiLinearProgress-colorSuccess': { backgroundColor: 'primary.main' },
            '& .MuiLinearProgress-bar': {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0
            }
          }}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {data.completedTransactions.toLocaleString()} Completed
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {data.pendingTransactions.toLocaleString()} Pending
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AnalyticsTransactionVisits
