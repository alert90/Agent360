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

const AgentChildAgents = ({ agent }: { agent: Agent }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Child Agents
        </Typography>
        {agent.child_agents && agent.child_agents.length > 0 ? (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Account Number</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Branch</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Transactions</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {agent.child_agents.map((childAgent: any) => (
                  <tr key={childAgent.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>
                      <Typography variant='body2' fontWeight='bold'>
                        {childAgent.name}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{childAgent.account_number}</td>
                    <td style={{ padding: '12px' }}>{childAgent.branch_name}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Typography variant='body2'>{childAgent.transaction_count?.toLocaleString() || 0}</Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Typography variant='body2' fontWeight='bold'>
                        {formatCurrency(childAgent.total_amount)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Chip
                        label={childAgent.is_active ? 'Active' : 'Inactive'}
                        size='small'
                        color={childAgent.is_active ? 'success' : 'error'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No child agents found
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default AgentChildAgents
