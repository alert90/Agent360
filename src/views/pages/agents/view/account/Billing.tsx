// ** MUI Components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
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

const AgentBilling = ({ agent }: { agent: Agent }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Billing Status
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant='body2'>
                <strong>Current Plan:</strong> {agent.type} Agent
              </Typography>
              <Typography variant='body2'>
                <strong>Status:</strong>{' '}
                <Chip
                  label={agent.is_active ? 'Active' : 'Inactive'}
                  size='small'
                  color={agent.is_active ? 'success' : 'error'}
                />
              </Typography>
            </Box>
            <Typography variant='body2'>
              <strong>Monthly Commission:</strong> {formatCurrency(agent.commission_amount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Plan Details
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Agent plan and commission structure information.
            </Typography>
            <Box>
              <Typography variant='body2'>
                <strong>Payband:</strong> {agent.payband || 1.0}
              </Typography>
              <Typography variant='body2'>
                <strong>Commission Eligible:</strong>{' '}
                <Chip
                  label={agent.commission_eligible ? 'Yes' : 'No'}
                  size='small'
                  color={agent.commission_eligible ? 'success' : 'error'}
                />
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AgentBilling
