// ** React Imports
import { useState, useEffect, ReactElement, SyntheticEvent } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Components
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import { styled, Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MuiTabList, { TabListProps } from '@mui/lab/TabList'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hook Imports
import { useAuth } from 'src/hooks/useAuth'

// ** Demo Components
import AgentAccountDetails from './AccountDetails'
import AgentActivities from './Activities'
import AgentInvoices from './Invoices'
import AgentSecurity from './Security'
import AgentBilling from './Billing'
import AgentNotifications from './Notifications'
import AgentConnections from './Connections'
import AgentChildAgents from './ChildAgents'

const TabList = styled(MuiTabList)<TabListProps>(({ theme }) => ({
  borderBottom: '0 !important',
  '&, & .MuiTabs-scroller': {
    boxSizing: 'content-box',
    padding: theme.spacing(1.25, 1.25, 2),
    margin: `${theme.spacing(-1.25, -1.25, -2)} !important`
  },
  '& .MuiTabs-indicator': {
    display: 'none'
  },
  '& .Mui-selected': {
    boxShadow: theme.shadows[2],
    backgroundColor: theme.palette.primary.main,
    color: `${theme.palette.common.white} !important`
  },
  '& .MuiTab-root': {
    minWidth: 65,
    minHeight: 38,
    lineHeight: 1,
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      color: theme.palette.primary.main
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: 130
    }
  }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

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

interface AccountTabProps {
  tab?: string
  agentId?: string
}

const AccountTab = ({ tab = 'account-details', agentId }: AccountTabProps) => {
  // ** State
  const [activeTab, setActiveTab] = useState<string>(tab)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    contact: '',
    role: '',
    region: '',
    zone: '',
    account_number: '',
    type: '',
    branch_name: '',
    branch_code: '',
    is_active: true
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // ** Hooks
  const router = useRouter()
  const { user } = useAuth()
  const hideText = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!router.isReady || !user) return

      setIsLoading(true)
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          console.error('No authentication token found')

          return
        }

        const id = agentId || router.query.id
        if (!id) {
          throw new Error('Agent ID is required')
        }

        const response = await axios.get(`/api/agents/${id}/account`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.data.success) {
          setAgent(response.data.data)
        } else {
          throw new Error(response.data.message || 'Failed to fetch agent account')
        }
      } catch (error: any) {
        console.error('Error fetching agent data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgentData()
  }, [router.isReady, user, router.query, agentId])

  const handleChange = (event: SyntheticEvent, value: string) => {
    setIsLoading(true)
    setActiveTab(value)
    router
      .push({
        pathname: `/agents/view/${agentId || router.query.id}?tab=${value.toLowerCase()}`
      })
      .then(() => setIsLoading(false))
  }

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [tab])

  const handleSuspend = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const id = agentId || router.query.id
      const response = await axios.post(
        `/api/agents/${id}/suspend`,
        { reason: suspendReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        setAgent((prev: any) => ({ ...prev!, status: 'suspended', is_active: false }))
        setSuspendDialogOpen(false)
        setSuspendReason('')
        setSnackbar({
          open: true,
          message: 'Agent suspended successfully. Awaiting analyst approval.',
          severity: 'success'
        })
      } else {
        throw new Error(response.data.message || 'Failed to suspend agent')
      }
    } catch (error: any) {
      console.error('Failed to suspend agent:', error)
      setSnackbar({
        open: true,
        message: error.message || 'Failed to suspend agent',
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev: any) => ({ ...prev, open: false }))
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
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

  const handleEdit = () => {
    setEditForm({
      name: agent!.name,
      username: agent!.username || '',
      email: agent!.email || '',
      phone: agent!.phone || '',
      contact: agent!.contact || '',
      role: agent!.role,
      region: agent!.region || '',
      zone: agent!.zone || '',
      account_number: agent!.account_number,
      type: agent!.type,
      branch_name: agent!.branch_name,
      branch_code: agent!.branch_code,
      is_active: agent!.is_active
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const id = agentId || router.query.id
      const response = await axios.put(`/api/agents/${id}/account`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setAgent((prev: any) => ({ ...prev!, ...response.data.data }))
        setEditDialogOpen(false)
        setSnackbar({
          open: true,
          message: 'Agent updated successfully',
          severity: 'success'
        })
      } else {
        throw new Error(response.data.message || 'Failed to update agent')
      }
    } catch (error: any) {
      console.error('Failed to update agent:', error)
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update agent',
        severity: 'error'
      })
    }
  }

  const tabContentList: { [key: string]: ReactElement } = {
    'account-details': <AgentAccountDetails agent={agent!} onEdit={handleEdit} />,
    activities: <AgentActivities agent={agent!} />,
    'invoice-list': <AgentInvoices agent={agent!} />,
    security: <AgentSecurity agent={agent!} />,
    'billing-plan': <AgentBilling agent={agent!} />,
    notifications: <AgentNotifications agent={agent!} />,
    connections: <AgentConnections agent={agent!} />,
    'child-agents': <AgentChildAgents agent={agent!} />
  }

  if (isLoading || !agent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 4 }}>
        <LinkStyled href='/'>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Dashboard
          </Typography>
        </LinkStyled>
        <LinkStyled href='/agents/list'>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Agents
          </Typography>
        </LinkStyled>
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          Agent Account - {agent.name}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            {agent.name}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Agent Account Management - {agent.account_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            Status:
          </Typography>
          <Chip
            label={agent.status || (agent.is_active ? 'Active' : 'Inactive')}
            size='small'
            color={getStatusColor(agent.status || (agent.is_active ? 'active' : 'inactive'))}
          />
          <Button
            variant='outlined'
            color='error'
            size='small'
            startIcon={<Icon icon='tabler:player-pause' />}
            onClick={() => setSuspendDialogOpen(true)}
            disabled={agent.status === 'suspended'}
          >
            Suspend
          </Button>
        </Box>
      </Box>

      {/* Commission Eligibility Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<Icon icon='tabler:coin' />}
                  label={agent.commission_eligible ? 'Eligible' : 'Not Eligible'}
                  color={agent.commission_eligible ? 'success' : 'error'}
                  size='small'
                />
                <Box>
                  <Typography variant='h6'>Commission Status</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {agent.commission_eligible ? 'Eligible for commission' : 'Not eligible for commission'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='h6' color='primary'>
                {agent.transaction_count?.toLocaleString() || 0}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Transactions
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='h6' color='success.main'>
                {formatCurrency(agent.total_transaction_amount || 0)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Amount
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='h6' color='warning.main'>
                {formatCurrency(agent.commission_amount || 0)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <TabList variant='scrollable' scrollButtons='auto' onChange={handleChange} aria-label='agent tabs'>
              <Tab
                value='account-details'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:user-check' />
                    {!hideText && 'Account Details'}
                  </Box>
                }
              />
              <Tab
                value='activities'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:activity' />
                    {!hideText && 'Activities'}
                  </Box>
                }
              />
              <Tab
                value='invoice-list'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:file-invoice' />
                    {!hideText && 'Invoice List'}
                  </Box>
                }
              />
              <Tab
                value='security'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:shield' />
                    {!hideText && 'Security'}
                  </Box>
                }
              />
              <Tab
                value='billing-plan'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:credit-card' />
                    {!hideText && 'Billing & Plan'}
                  </Box>
                }
              />
              <Tab
                value='notifications'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:bell' />
                    {!hideText && 'Notifications'}
                  </Box>
                }
              />
              <Tab
                value='connections'
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                    <Icon fontSize='1.125rem' icon='tabler:link' />
                    {!hideText && 'Connections'}
                  </Box>
                }
              />
              {agent.child_agents && agent.child_agents.length > 0 && (
                <Tab
                  value='child-agents'
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
                      <Icon fontSize='1.125rem' icon='tabler:users' />
                      {!hideText && 'Child Agents'}
                    </Box>
                  }
                />
              )}
            </TabList>
          </Grid>
          <Grid item xs={12}>
            {isLoading ? (
              <Box sx={{ mt: 6, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <CircularProgress sx={{ mb: 4 }} />
                <Typography>Loading...</Typography>
              </Box>
            ) : (
              <TabPanel sx={{ p: 0 }} value={activeTab}>
                {agent && tabContentList[activeTab]}
              </TabPanel>
            )}
          </Grid>
        </Grid>
      </TabContext>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Name'
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Username'
                value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Phone'
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Contact'
                value={editForm.contact}
                onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Role'
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Region'
                value={editForm.region}
                onChange={e => setEditForm({ ...editForm, region: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Zone'
                value={editForm.zone}
                onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Account Number'
                value={editForm.account_number}
                onChange={e => setEditForm({ ...editForm, account_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Type'
                value={editForm.type}
                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Branch Name'
                value={editForm.branch_name}
                onChange={e => setEditForm({ ...editForm, branch_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Branch Code'
                value={editForm.branch_code}
                onChange={e => setEditForm({ ...editForm, branch_code: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant='contained' color='primary'>
            Update Agent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Suspend Agent</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Reason for Suspension'
            multiline
            rows={4}
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSuspend} variant='contained' color='error' disabled={!suspendReason.trim()}>
            Suspend Agent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

AccountTab.getInitialProps = async (context: any) => {
  const { tab } = context.query || context.params || {}

  return {
    tab: tab || 'account-details'
  }
}

export default AccountTab
