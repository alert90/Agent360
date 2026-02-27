// ** MUI Components
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
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

const AgentConnections = ({ agent }: { agent: Agent }) => {
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
          Agent Connections
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          Connections with parent agents and child agents in the network.
        </Typography>

        {agent.parent_agent && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' gutterBottom>
              Parent Agent
            </Typography>
            <Card variant='outlined'>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant='body1' fontWeight='bold'>
                      {agent.parent_agent.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Account: {agent.parent_agent.account_number}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Type: {agent.parent_agent.type}
                    </Typography>
                  </Box>
                  <Chip label={agent.parent_agent.type} size='small' color='primary' variant='outlined' />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {agent.child_agents && agent.child_agents.length > 0 && (
          <Box>
            <Typography variant='h6' gutterBottom>
              Child Agents ({agent.child_agents.length})
            </Typography>
            <Grid container spacing={2}>
              {agent.child_agents.map((childAgent: any) => (
                <Grid item xs={12} md={6} key={childAgent.id}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='body1' fontWeight='bold'>
                          {childAgent.name}
                        </Typography>
                        <Chip
                          label={childAgent.is_active ? 'Active' : 'Inactive'}
                          size='small'
                          color={childAgent.is_active ? 'success' : 'error'}
                        />
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        Account: {childAgent.account_number}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Branch: {childAgent.branch_name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Transactions: {childAgent.transaction_count?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Amount: {formatCurrency(childAgent.total_amount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {!agent.parent_agent && (!agent.child_agents || agent.child_agents.length === 0) && (
          <Typography variant='body2' color='text.secondary'>
            No agent connections found.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default AgentConnections
