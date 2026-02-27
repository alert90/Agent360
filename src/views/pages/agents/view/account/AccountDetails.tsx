// ** React Imports
import { SyntheticEvent } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

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

const AgentAccountDetails = ({ agent, onEdit }: { agent: Agent; onEdit: () => void }) => {
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

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'pending':
        return 'warning'
      case 'suspended':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Agent Information</Typography>
              <Button variant='outlined' size='small' startIcon={<Icon icon='tabler:edit' />} onClick={onEdit}>
                Edit
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' fontWeight='bold'>
                {agent.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {agent.account_number}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Username:</strong> {agent.username || 'N/A'}
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {agent.email || 'N/A'}
              </Typography>
              <Typography variant='body2'>
                <strong>Phone:</strong> {agent.phone || 'N/A'}
              </Typography>
              <Typography variant='body2'>
                <strong>Contact:</strong> {agent.contact || 'N/A'}
              </Typography>
              <Typography variant='body2'>
                <strong>Status:</strong>{' '}
                <Chip
                  label={agent.status || (agent.is_active ? 'Active' : 'Inactive')}
                  size='small'
                  color={getStatusColor(agent.status || (agent.is_active ? 'active' : 'inactive'))}
                />
              </Typography>
              <Typography variant='body2'>
                <strong>Role:</strong> {agent.role || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Chip label={agent.type} size='small' variant='outlined' color='primary' />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Branch:</strong> {agent.branch_name} ({agent.branch_code})
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Region:</strong> {agent.region || 'N/A'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Zone:</strong> {agent.zone || 'N/A'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Recent Transactions (30 days):</strong> {agent.recent_transactions?.toLocaleString() || 0}
              </Typography>
              <Typography variant='body2'>
                <strong>Recent Amount:</strong> {formatCurrency(agent.recent_amount || 0)}
              </Typography>
            </Box>
            {agent.parent_agent && (
              <Box sx={{ mb: 2 }}>
                <Typography variant='body2'>
                  <strong>Parent Agent:</strong> {agent.parent_agent.name} ({agent.parent_agent.account_number})
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Type: {agent.parent_agent.type}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant='body2'>
                <strong>Created:</strong> {formatDate(agent.created_at)}
              </Typography>
              <Typography variant='body2'>
                <strong>Last Updated:</strong> {formatDate(agent.updated_at)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AgentAccountDetails
