// ** MUI Components
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

interface Agent {
  id: number
  account_number: string
  name: string
  username?: string
  email?: string
  phone?: string
  contact?: string
  role: string
  type: string
  branch_code: string
  branch_name: string
  region?: string
  zone?: string
  parent_agent_id: number | null
  is_active: boolean
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  commission_eligible?: boolean
  payband: number
  created_at: string
  updated_at: string
  recent_transactions?: number
  recent_amount?: number
  parent_agent?: any
  child_agents?: any[]
  recent_transactions_data?: any[]
  transaction_summary?: any[]
  monthly_performance?: any[]
}

const AgentActivities = ({ agent }: { agent: Agent }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Recent Transactions
        </Typography>
        {agent.recent_transactions_data && agent.recent_transactions_data.length > 0 ? (
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
                {agent.recent_transactions_data.map((transaction: any) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{transaction.transaction_id}</td>
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
                      <Chip label={transaction.type} size='small' />
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
                      <Chip
                        label={transaction.status}
                        size='small'
                        color={transaction.status === 'COMPLETED' ? 'success' : 'warning'}
                      />
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
          <Typography variant='body2' color='text.secondary'>
            No recent transactions found
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default AgentActivities
