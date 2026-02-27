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
  id: string
  name: string
  account_number: string
  type: string
  is_active: boolean
  parent_agent_id?: string
  email?: string
  phone?: string
  address?: string
  created_at: string
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
  id: string
  name: string
  account_number: string
  type: string
  is_active: boolean
  assigned_at: string
  total_transactions: number
  total_amount: number
}

const AgentView = () => {
  const router = useRouter()
  const { id, tab } = router.query

  const [agent, setAgent] = useState<Agent | null>(null)
  const [associatedAgents, setAssociatedAgents] = useState<AssociatedAgent[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState((tab as string) || 'transactions')
  const [transactionPagination, setTransactionPagination] = useState({ page: 0, pageSize: 25 })

  // Agent search state
  const [agentSearchTerm, setAgentSearchTerm] = useState('')

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
    if (!agent || (agent.type !== 'super_agent' && agent.type !== 'franchise')) {
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
  }, [agent, id])

  const fetchTransactions = useCallback(async () => {
    if (!agent) {
      setTransactions([])

      return
    }

    try {
      const response = await fetch(`/api/agents/${id}/transactions`)
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
    }
  }, [id, fetchAgentDetails])

  useEffect(() => {
    if (agent) {
      if (currentTab === 'agents') {
        fetchAssociatedAgents()
      } else if (currentTab === 'transactions') {
        fetchTransactions()
      }
    }
  }, [agent, currentTab, fetchAssociatedAgents, fetchTransactions])

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
        agent.id.toLowerCase().includes(agentSearchTerm.toLowerCase())
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

  return (
    <Box sx={{ p: 6 }}>
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
                Account: {agent.account_number}
              </Typography>
              <Chip
                label={agent.is_active ? 'Active' : 'Inactive'}
                size='small'
                color={agent.is_active ? 'success' : 'error'}
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
                <strong>Phone:</strong> {agent.phone || 'Not provided'}
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
                <strong>Account Number:</strong> {agent.account_number}
              </Typography>
              <Typography variant='body2'>
                <strong>Created:</strong> {new Date(agent.created_at).toLocaleDateString()}
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
            {(agent.type === 'super_agent' || agent.type === 'franchise') && <Tab label='Agents' value='agents' />}
          </TabList>
        </Box>

        {/* Account Tab */}
        <TabPanel value='account'>
          <Card>
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
                    <strong>Status:</strong> {agent.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Member Since:</strong> {new Date(agent.created_at).toLocaleDateString()}
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
                    <strong>Associated Agents:</strong> {associatedAgents.length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Agents Tab */}
        {(agent.type === 'super_agent' || agent.type === 'franchise') && (
          <TabPanel value='agents'>
            <Card>
              <CardHeader
                title='Associated Agents'
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
                              <Button
                                size='small'
                                variant='outlined'
                                startIcon={<Icon icon='tabler:eye' />}
                                onClick={() => router.push(`/agents/view/${assocAgent.id}`)}
                              >
                                View
                              </Button>
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
                        : `No agents assigned to ${agent.name}`}
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
                              label={`${typeSummary.label.toUpperCase()}: ${typeSummary.count} (TZS ${typeSummary.total.toLocaleString()})`}
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
