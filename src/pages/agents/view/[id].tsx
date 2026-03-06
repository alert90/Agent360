import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface Agent {
  id: number
  name: string
  accountNumber: string
  type: string
  isActive: number
  parentAgentId?: number | null
  email?: string | null
  phone?: string | null
  contact?: string | null
  address?: string
  createdAt: Date | string
}

interface Transaction {
  id: string
  transactionId?: string
  agent_id: string
  transaction_date?: string
  timestamp?: string
  amount: number
  type?: string
  transaction_type?: string
  reference_number?: string
  reference?: string
  status: string
  description?: string
  narration?: string
  agent_name?: string
  agent_account_number?: string
  commission_amount?: number
}

interface AssociatedAgent {
  id: number
  name: string
  account_number: string
  type: string
  is_active: boolean
  assigned_at: string
  total_transactions: number
  total_amount: number
}

interface TransactionAgent {
  id: number | null
  name: string
  account_number: string
  type: string
  is_active: boolean
  parent_agent_id: number | null
  transaction_count: number
  total_amount: number
  last_transaction_date: string | null
  transaction_types: string
  is_detected: boolean
  is_assigned: boolean
}

interface TransactionAgentsMeta {
  threshold: number
  agent_type: string
  detected_type: string | null
  is_auto_detected: boolean
  total_detected: number
  assigned_count: number
  unassigned_count: number
}

const AgentView = () => {
  const router = useRouter()
  const { id, tab } = router.query

  const [agent, setAgent] = useState<Agent | null>(null)
  const [associatedAgents, setAssociatedAgents] = useState<AssociatedAgent[]>([])
  const [transactionAgents, setTransactionAgents] = useState<TransactionAgent[]>([])
  const [transactionAgentsMeta, setTransactionAgentsMeta] = useState<TransactionAgentsMeta | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState((tab as string) || 'transactions')
  const [transactionPagination, setTransactionPagination] = useState({ page: 0, pageSize: 25 })
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null)

  // Agent search state
  const [agentSearchTerm, setAgentSearchTerm] = useState('')

  // Transaction agent search and pagination state
  const [transactionAgentSearchTerm, setTransactionAgentSearchTerm] = useState('')
  const [transactionAgentPagination, setTransactionAgentPagination] = useState({ page: 0, pageSize: 25 })

  // Transaction agent filter state
  const [transactionAgentFilter, setTransactionAgentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')

  // Helper to check if agent should show Agents tab (either explicitly or auto-detected or has transaction agents)
  const shouldShowAgentsTab = (): boolean => {
    if (!agent) return false

    // Show Agents tab if agent is super_agent/franchise OR has transaction agents detected
    if (agent.type === 'super_agent' || agent.type === 'franchise') return true
    if (transactionAgentsMeta && transactionAgentsMeta.total_detected > 0) return true

    return false
  }

  const fetchAgentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgent(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching agent details:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchAssociatedAgents = useCallback(async () => {
    // For auto-detected agents, we should still try to fetch associated agents
    if (!agent) {
      setAssociatedAgents([])

      return
    }

    // Check if agent is super_agent/franchise either explicitly or auto-detected
    const isSuperOrFranchise =
      agent.type === 'super_agent' || agent.type === 'franchise' || transactionAgentsMeta?.is_auto_detected

    if (!isSuperOrFranchise) {
      setAssociatedAgents([])

      return
    }

    try {
      const response = await fetch(`/api/agents/${id}/associated`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAssociatedAgents(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching associated agents:', error)
    }
  }, [agent, id, transactionAgentsMeta?.is_auto_detected])

  // Fetch transaction-detected agents (potential super_agents/franchises)
  const fetchTransactionAgents = useCallback(async () => {
    // For now, always try to fetch - the API will handle the logic of returning empty
    // if the agent is truly a local_agent without transaction history
    // We'll check after getting response to determine if we should show Agents tab

    try {
      const response = await fetch(`/api/agents/${id}/transaction-agents`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactionAgents(result.data)
          setTransactionAgentsMeta(result.meta)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction agents:', error)
    }
  }, [id])

  // Handle assigning a transaction-detected agent
  const handleAssignAgent = async (targetAgentId: number, accountNumber: string) => {
    setAssigningAgent(accountNumber)
    try {
      const response = await fetch(`/api/agents/${id}/assign-transaction-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_agent_id: targetAgentId,
          target_account_number: accountNumber
        })
      })

      const result = await response.json()
      if (result.success) {
        // Refresh the transaction agents list
        await fetchTransactionAgents()

        // Also refresh associated agents
        await fetchAssociatedAgents()
      } else {
        alert(result.message || 'Failed to assign agent')
      }
    } catch (error) {
      console.error('Error assigning agent:', error)
      alert('Failed to assign agent')
    } finally {
      setAssigningAgent(null)
    }
  }

  // Handle unassigning an agent (works for both transaction-detected and manually assigned)
  const handleUnassignAgent = async (targetAgentId: number, accountNumber: string) => {
    if (!confirm(`Are you sure you want to unassign ${accountNumber}?`)) {
      return
    }

    setAssigningAgent(accountNumber)
    try {
      const response = await fetch(
        `/api/agents/${id}/assign-transaction-agent?target_agent_id=${targetAgentId}&target_account_number=${accountNumber}`,
        {
          method: 'DELETE'
        }
      )

      const result = await response.json()
      if (result.success) {
        // Refresh the transaction agents list
        await fetchTransactionAgents()

        // Also refresh associated agents
        await fetchAssociatedAgents()
      } else {
        alert(result.message || 'Failed to unassign agent')
      }
    } catch (error) {
      console.error('Error unassigning agent:', error)
      alert('Failed to unassign agent')
    } finally {
      setAssigningAgent(null)
    }
  }

  const fetchTransactions = useCallback(async () => {
    if (!agent) {
      setTransactions([])

      return
    }

    try {
      // Fetch first page with large limit to get all transactions
      const response = await fetch(`/api/agents/${id}/transactions?page=1&limit=10000`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }, [agent, id])

  useEffect(() => {
    if (id) {
      fetchAgentDetails()

      // Also fetch transaction agents to determine if we should show Agents tab
      fetchTransactionAgents()
    }
  }, [id, fetchAgentDetails, fetchTransactionAgents])

  useEffect(() => {
    if (agent) {
      if (currentTab === 'agents') {
        fetchAssociatedAgents()
      } else if (currentTab === 'transactions') {
        fetchTransactions()
      } else if (currentTab === 'account') {
        // Fetch both associated agents and transaction agents for account tab
        fetchAssociatedAgents()
        fetchTransactionAgents()
      }
    }
  }, [agent, currentTab, fetchAssociatedAgents, fetchTransactions, fetchTransactionAgents])

  const handleTabChange = (event: any, newValue: string) => {
    setCurrentTab(newValue)
    router.push(`/agents/view/${id}?tab=${newValue}`, undefined, { shallow: true })
  }

  const handleTransactionClick = (transaction: Transaction) => {
    const transactionId = transaction.transactionId || transaction.id
    router.push(`/transactions/${transactionId}`)
  }

  const handleAgentSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentSearchTerm(event.target.value)
  }

  // Filter agents by search term
  const getFilteredAgents = () => {
    if (!agentSearchTerm) return associatedAgents

    return associatedAgents.filter(
      agent =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.account_number.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        String(agent.id).toLowerCase().includes(agentSearchTerm.toLowerCase())
    )
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary'
      case 'franchise':
        return 'secondary'
      case 'local_agent':
        return 'default'
      default:
        return 'default'
    }
  }

  const getTransactionTypeColor = (type: string) => {
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

  const transactionSummary = useMemo(() => {
    const summary = new Map<string, { label: string; count: number; total: number }>()
    let overallTotal = 0

    transactions.forEach(transaction => {
      const transactionType = (transaction.type || transaction.transaction_type || 'other').toLowerCase()
      const existing = summary.get(transactionType) || {
        label: transactionType,
        count: 0,
        total: 0
      }

      existing.count += 1
      existing.total += transaction.amount || 0
      overallTotal += transaction.amount || 0

      summary.set(transactionType, existing)
    })

    return {
      totalCount: transactions.length,
      totalAmount: overallTotal,
      byType: Array.from(summary.values()).sort((a, b) => a.label.localeCompare(b.label))
    }
  }, [transactions])

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading agent details...
        </Typography>
      </Box>
    )
  }

  if (!agent) {
    return (
      <Box sx={{ p: 6 }}>
        <Alert severity='error'>Agent not found</Alert>
      </Box>
    )
  }

  // Helper to get display name for agent type
  const getAgentTypeDisplayName = (type: string | null | undefined): string => {
    if (!type) return 'UNKNOWN'

    return type.replace('_', ' ').toUpperCase()
  }

  // Helper to get description for detected agent type
  const getAgentTypeDescription = (type: string | null | undefined): string => {
    if (type === 'franchise') {
      return 'Franchise agents typically transact with both agents (01J7 accounts) and customers. They usually have more deposits than transfers.'
    }
    if (type === 'super_agent') {
      return 'Super agents primarily transact with other agents (01J7 accounts) and rarely with direct customers. They usually have more transfers than deposits.'
    }

    return ''
  }

  return (
    <Box sx={{ p: 6 }}>
      {/* Back Button and Agent Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Button
          variant='outlined'
          startIcon={<Icon icon='tabler:arrow-left' />}
          onClick={() => router.push('/agents/list')}
        >
          Back to Agents
        </Button>
      </Box>

      {/* Agent Header */}
      <Card sx={{ mb: 6 }}>
        <CardHeader
          title={agent.name}
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={agent.type.replace('_', ' ').toUpperCase()}
                size='small'
                color={getAgentTypeColor(agent.type) as any}
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                Account: {agent.accountNumber}
              </Typography>
              <Chip
                label={agent.isActive ? 'Active' : 'Inactive'}
                size='small'
                color={agent.isActive ? 'success' : 'error'}
                variant='outlined'
              />
            </Box>
          }
          action={
            <Button
              variant='outlined'
              startIcon={<Icon icon='tabler:edit' />}
              onClick={() => router.push(`/agents/edit/${id}`)}
            >
              Edit Agent
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Contact Information
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {agent.email || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Phone:</strong> {agent.phone || agent.contact || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Address:</strong> {agent.address || 'Not provided'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Account Details
              </Typography>
              <Typography variant='body2'>
                <strong>Agent ID:</strong> {agent.id}
              </Typography>
              <Typography variant='body2'>
                <strong>Account Number:</strong> {agent.accountNumber || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Created:</strong>{' '}
                {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Not provided'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <TabContext value={currentTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label='Agent details tabs'>
            <Tab label='Transactions' value='transactions' />
            <Tab label='Account' value='account' />
            {shouldShowAgentsTab() && <Tab label='Agents' value='agents' />}
          </TabList>
        </Box>

        {/* Account Tab */}
        <TabPanel value='account'>
          <Card sx={{ mb: 4 }}>
            <CardHeader title='Account Information' />
            <CardContent>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Detailed account information for {agent.name}
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' sx={{ mb: 2 }}>
                    Profile Information
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Full Name:</strong> {agent.name}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Agent Type:</strong> {agent.type.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Status:</strong> {agent.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Member Since:</strong>{' '}
                    {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' sx={{ mb: 2 }}>
                    Financial Summary
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Total Transactions:</strong> {transactions.length}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Total Volume:</strong> TZS{' '}
                    {transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Associated Agents:</strong>{' '}
                    {transactionAgentsMeta?.assigned_count || associatedAgents.length} of{' '}
                    {transactionAgentsMeta?.total_detected || associatedAgents.length} assigned to {agent.name}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Associated Agents Section on Account Tab */}
          <Card>
            <CardHeader title='Associated Agents' subheader='List of agents assigned to this account' />
            <CardContent>
              {associatedAgents.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent Name</TableCell>
                        <TableCell>Account Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='right'>Transactions</TableCell>
                        <TableCell align='right'>Total Amount</TableCell>
                        <TableCell>Assigned Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {associatedAgents.map(assocAgent => (
                        <TableRow key={assocAgent.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight='medium'>
                              {assocAgent.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{assocAgent.account_number}</TableCell>
                          <TableCell>
                            <Chip
                              label={assocAgent.type.replace('_', ' ').toUpperCase()}
                              size='small'
                              color='default'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={assocAgent.is_active ? 'Active' : 'Inactive'}
                              size='small'
                              color={assocAgent.is_active ? 'success' : 'error'}
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell align='right'>{assocAgent.total_transactions}</TableCell>
                          <TableCell align='right'>TZS {assocAgent.total_amount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(assocAgent.assigned_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No associated agents found for {agent.name}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Agents Tab */}
        {shouldShowAgentsTab() && (
          <TabPanel value='agents'>
            {/* Auto-detected type warning */}
            {transactionAgentsMeta?.is_auto_detected && (
              <Alert severity='info' sx={{ mb: 3 }}>
                <Typography variant='body2'>
                  This agent was automatically detected as a{' '}
                  <strong>{getAgentTypeDisplayName(transactionAgentsMeta.detected_type)}</strong> based on transaction
                  patterns ({transactionAgentsMeta.total_detected} agents transacted with).
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {getAgentTypeDescription(transactionAgentsMeta.detected_type)}
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  The agent type can be updated in agent settings.
                </Typography>
              </Alert>
            )}

            <Card sx={{ mb: 4 }}>
              <CardHeader
                title='Transaction-Detected Agents'
                subheader={
                  <Typography variant='body2' color='text.secondary'>
                    Agents detected based on deposit/transfer transactions to accounts starting with 01J7 (threshold:{' '}
                    {transactionAgentsMeta?.threshold || 10}+ transactions)
                  </Typography>
                }
              />
              <CardContent>
                {/* Summary chips */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    label={`Total Detected: ${transactionAgentsMeta?.total_detected || 0}`}
                    color='primary'
                    variant='outlined'
                  />
                  <Chip
                    label={`Assigned: ${transactionAgentsMeta?.assigned_count || 0}`}
                    color='success'
                    variant='outlined'
                  />
                  <Chip
                    label={`Unassigned: ${transactionAgentsMeta?.unassigned_count || 0}`}
                    color='warning'
                    variant='outlined'
                  />
                </Box>

                {transactionAgents.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Agent Name</TableCell>
                          <TableCell>Account Number</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align='right'>Transactions</TableCell>
                          <TableCell align='right'>Total Amount</TableCell>
                          <TableCell>Last Transaction</TableCell>
                          <TableCell>Assignment</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactionAgents.map(txAgent => (
                          <TableRow key={txAgent.account_number} hover>
                            <TableCell>
                              <Typography variant='body2' fontWeight='medium'>
                                {txAgent.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{txAgent.account_number}</TableCell>
                            <TableCell>
                              <Chip
                                label={txAgent.type.replace('_', ' ').toUpperCase()}
                                size='small'
                                color='default'
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={txAgent.is_active ? 'Active' : 'Inactive'}
                                size='small'
                                color={txAgent.is_active ? 'success' : 'error'}
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell align='right'>{txAgent.transaction_count}</TableCell>
                            <TableCell align='right'>TZS {txAgent.total_amount?.toLocaleString() || 0}</TableCell>
                            <TableCell>
                              {txAgent.last_transaction_date
                                ? new Date(txAgent.last_transaction_date).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={txAgent.is_assigned ? 'Assigned' : 'Unassigned'}
                                size='small'
                                color={txAgent.is_assigned ? 'success' : 'warning'}
                                variant={txAgent.is_assigned ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell>
                              {txAgent.id ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    startIcon={<Icon icon='tabler:eye' />}
                                    onClick={() => router.push(`/agents/view/${txAgent.id}`)}
                                  >
                                    View
                                  </Button>
                                  {txAgent.is_assigned ? (
                                    <Button
                                      size='small'
                                      variant='outlined'
                                      color='error'
                                      startIcon={<Icon icon='tabler:user-minus' />}
                                      onClick={() => handleUnassignAgent(txAgent.id as number, txAgent.account_number)}
                                      disabled={assigningAgent === txAgent.account_number}
                                    >
                                      Unassign
                                    </Button>
                                  ) : (
                                    <Button
                                      size='small'
                                      variant='contained'
                                      color='primary'
                                      startIcon={<Icon icon='tabler:user-plus' />}
                                      onClick={() => handleAssignAgent(txAgent.id as number, txAgent.account_number)}
                                      disabled={assigningAgent === txAgent.account_number}
                                    >
                                      Assign
                                    </Button>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant='body2' color='text.secondary'>
                                  Not in system
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No transaction-detected agents found. Agents with more than 10 transactions to accounts starting
                      with 01J7 will appear here.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Manually Assigned Agents */}
            <Card>
              <CardHeader
                title='Manually Assigned Agents'
                subheader={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {getFilteredAgents().length} of {associatedAgents.length} agents assigned to {agent.name}
                    </Typography>
                    <TextField
                      size='small'
                      placeholder='Search by name, account number, or ID...'
                      value={agentSearchTerm}
                      onChange={handleAgentSearch}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <Icon icon='tabler:search' />
                          </InputAdornment>
                        )
                      }}
                      sx={{ width: 300 }}
                    />
                  </Box>
                }
              />
              <CardContent>
                {getFilteredAgents().length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Agent Name</TableCell>
                          <TableCell>Account Number</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align='right'>Transactions</TableCell>
                          <TableCell align='right'>Total Amount</TableCell>
                          <TableCell>Assigned Date</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredAgents().map(assocAgent => (
                          <TableRow key={assocAgent.id} hover>
                            <TableCell>
                              <Typography variant='body2' fontWeight='medium'>
                                {assocAgent.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{assocAgent.account_number}</TableCell>
                            <TableCell>
                              <Chip
                                label={assocAgent.type.replace('_', ' ').toUpperCase()}
                                size='small'
                                color='default'
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assocAgent.is_active ? 'Active' : 'Inactive'}
                                size='small'
                                color={assocAgent.is_active ? 'success' : 'error'}
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell align='right'>{assocAgent.total_transactions}</TableCell>
                            <TableCell align='right'>TZS {assocAgent.total_amount.toLocaleString()}</TableCell>
                            <TableCell>{new Date(assocAgent.assigned_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  startIcon={<Icon icon='tabler:eye' />}
                                  onClick={() => router.push(`/agents/view/${Number(assocAgent.id)}`)}
                                >
                                  View
                                </Button>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  color='error'
                                  startIcon={<Icon icon='tabler:user-minus' />}
                                  onClick={() => handleUnassignAgent(Number(assocAgent.id), assocAgent.account_number)}
                                  disabled={assigningAgent === assocAgent.account_number}
                                >
                                  Unassign
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {agentSearchTerm
                        ? 'No agents found matching search criteria'
                        : `No agents manually assigned to ${agent.name}`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        )}

        {/* Transactions Tab */}
        <TabPanel value='transactions'>
          <Card>
            <CardHeader title='Transaction History' />
            <CardContent>
              {/* Transaction Filters */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='Search transactions...'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='tabler:search' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Type</InputLabel>
                    <Select label='Type' defaultValue=''>
                      <MenuItem value=''>All Types</MenuItem>
                      <MenuItem value='deposit'>Deposit</MenuItem>
                      <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                      <MenuItem value='transfer'>Transfer</MenuItem>
                      <MenuItem value='payment'>Payment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Transaction Summary */}
              <Card variant='outlined' sx={{ mb: 4 }}>
                <CardContent>
                  <Grid container spacing={3} alignItems='center'>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Transactions
                      </Typography>
                      <Typography variant='h6'>{transactionSummary.totalCount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Amount
                      </Typography>
                      <Typography variant='h6'>TZS {transactionSummary.totalAmount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                        By Type
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {transactionSummary.byType.length > 0 ? (
                          transactionSummary.byType.map(typeSummary => (
                            <Chip
                              key={typeSummary.label}
                              label={`${typeSummary.label.toUpperCase()}: ${
                                typeSummary.count
                              } (TZS ${typeSummary.total.toLocaleString()})`}
                              size='small'
                              variant='outlined'
                            />
                          ))
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            No transactions to summarize
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Transaction DataGrid */}
              <Box sx={{ height: 400, width: '100%' }}>
                {transactions.length > 0 ? (
                  <DataGrid
                    rows={transactions}
                    columns={[
                      {
                        field: 'timestamp',
                        headerName: 'Date',
                        minWidth: 120,
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Typography sx={{ color: 'text.secondary' }}>
                            {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : 'N/A'}
                          </Typography>
                        )
                      },
                      {
                        field: 'transactionId',
                        headerName: 'Reference',
                        minWidth: 150,
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Typography variant='body2'>
                            {row.transactionId || row.reference || row.reference_number || 'N/A'}
                          </Typography>
                        )
                      },
                      {
                        field: 'type',
                        headerName: 'Type',
                        minWidth: 100,
                        renderCell: ({ row }: { row: Transaction }) => {
                          const transactionType = row.type || row.transaction_type || 'transaction'

                          return (
                            <Chip
                              label={transactionType.toUpperCase()}
                              size='small'
                              color={getTransactionTypeColor(transactionType) as any}
                              variant='outlined'
                            />
                          )
                        }
                      },
                      {
                        field: 'description',
                        headerName: 'Description',
                        minWidth: 200,
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Typography variant='body2'>
                            {row.description || row.narration || row.type || row.transaction_type || 'N/A'}
                          </Typography>
                        )
                      },
                      {
                        field: 'amount',
                        headerName: 'Amount',
                        minWidth: 120,
                        type: 'number',
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Typography variant='body2' fontWeight='medium'>
                            TZS {row.amount.toLocaleString()}
                          </Typography>
                        )
                      },
                      {
                        field: 'commission_amount',
                        headerName: 'Commission',
                        minWidth: 120,
                        type: 'number',
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Typography variant='body2' color='text.secondary'>
                            TZS {(row.commission_amount || 0).toLocaleString()}
                          </Typography>
                        )
                      },
                      {
                        field: 'status',
                        headerName: 'Status',
                        minWidth: 100,
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Chip
                            label={row.status}
                            size='small'
                            color={row.status === 'completed' ? 'success' : 'warning'}
                            variant='outlined'
                          />
                        )
                      },
                      {
                        field: 'actions',
                        headerName: 'Actions',
                        minWidth: 120,
                        sortable: false,
                        renderCell: ({ row }: { row: Transaction }) => (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title='View Invoice'>
                              <IconButton size='small' onClick={() => handleTransactionClick(row)} color='primary'>
                                <Icon icon='tabler:file-invoice' fontSize={20} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }
                    ]}
                    paginationModel={transactionPagination}
                    onPaginationModelChange={setTransactionPagination}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.125rem'
                      }
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No transactions found for {agent.name}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </TabContext>
    </Box>
  )
}

AgentView.acl = {
  action: 'read',
  subject: 'agent-management'
}

export default AgentView
