// ** React Imports
import { ReactElement } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { AgentTransaction } from 'src/types/profile'

interface Props {
  data: AgentTransaction[]
}

const Projects = ({ data }: Props): ReactElement => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'info'
    }
  }

  const getTypeColor = (type: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'success'
      case 'withdrawal':
        return 'warning'
      case 'transfer':
        return 'info'
      case 'payment':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  return (
    <Grid container spacing={6}>
      {data && data.length > 0 ? (
        data.map(transaction => (
          <Grid item xs={12} key={transaction.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    <Icon icon='tabler:receipt' />
                  </Avatar>
                  <Box>
                    <Typography variant='h6'>{transaction.transaction_id}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {transaction.customer_name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>
                      Type: {transaction.type}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Amount: {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={transaction.status} color={getStatusColor(transaction.status)} size='small' />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Date: {formatDate(transaction.timestamp)}
                  </Typography>
                </Box>

                {transaction.commission_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='success.main'>
                      Commission: {formatCurrency(transaction.commission_amount)}
                    </Typography>
                    <Chip
                      label={transaction.commission_eligible ? 'Eligible' : 'Not Eligible'}
                      color={transaction.commission_eligible ? 'success' : 'default'}
                      size='small'
                    />
                  </Box>
                )}

                {transaction.narration && (
                  <Box>
                    <Typography variant='body2' color='text.secondary'>
                      Notes: {transaction.narration}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Icon icon='tabler:inbox' fontSize={48} sx={{ mb: 2, color: 'text.secondary' }} />
                <Typography variant='h6' color='text.secondary'>
                  No transactions found
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Transactions will appear here once you have activity
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default Projects
