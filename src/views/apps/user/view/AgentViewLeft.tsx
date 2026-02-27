// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogContentText from '@mui/material/DialogContentText'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Third Party Imports
import axios from 'axios'

interface ColorsType {
  [key: string]: ThemeColor
}

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
  child_agents_count?: number
}

const roleColors: ColorsType = {
  admin: 'error',
  analyst: 'warning',
  agent: 'primary',
  super_agent: 'success',
  franchise: 'info'
}

const statusColors: ColorsType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
  suspended: 'error'
}

// ** Styled <sup> component
const Sup = styled('sup')(({ theme }) => ({
  top: 0,
  left: -10,
  position: 'absolute',
  color: theme.palette.primary.main
}))

// ** Styled <sub> component
const Sub = styled('sub')(({ theme }) => ({
  alignSelf: 'flex-end',
  color: theme.palette.text.disabled,
  fontSize: theme.typography.body1.fontSize
}))

const AgentViewLeft = () => {
  // ** States
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false)
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
  const [suspendReason, setSuspendReason] = useState('')

  // ** Hooks
  const router = useRouter()
  const { user } = useAuth()

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!router.isReady || !user) return

      setLoading(true)
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          console.error('No authentication token found')

          return
        }

        const { id } = router.query
        if (!id) {
          throw new Error('Agent ID is required')
        }

        const response = await axios.get(`/api/agents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.data.success) {
          setAgent(response.data.data)
        } else {
          throw new Error(response.data.message || 'Failed to fetch agent')
        }
      } catch (error: any) {
        console.error('Error fetching agent data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [router.isReady, user, router.query])

  // Handle Edit dialog
  const handleEditClickOpen = () => {
    if (!agent) return
    setEditForm({
      name: agent.name,
      username: agent.username || '',
      email: agent.email || '',
      phone: agent.phone || '',
      contact: agent.contact || '',
      role: agent.role,
      region: agent.region || '',
      zone: agent.zone || '',
      account_number: agent.account_number,
      type: agent.type,
      branch_name: agent.branch_name,
      branch_code: agent.branch_code,
      is_active: agent.is_active
    })
    setOpenEdit(true)
  }
  const handleEditClose = () => setOpenEdit(false)

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const { id } = router.query
      const response = await axios.put(`/api/agents/${id}/account`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setAgent((prev: any) => ({ ...prev!, ...response.data.data }))
        setOpenEdit(false)
      } else {
        throw new Error(response.data.message || 'Failed to update agent')
      }
    } catch (error: any) {
      console.error('Failed to update agent:', error)
    }
  }

  const handleSuspend = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const { id } = router.query
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
      } else {
        throw new Error(response.data.message || 'Failed to suspend agent')
      }
    } catch (error: any) {
      console.error('Failed to suspend agent:', error)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!agent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          Agent not found
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ pt: 13.5, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <CustomAvatar
              skin='light'
              variant='rounded'
              color='primary'
              sx={{ width: 100, height: 100, mb: 4, fontSize: '3rem' }}
            >
              {getInitials(agent.name)}
            </CustomAvatar>
            <Typography variant='h4' sx={{ mb: 3 }}>
              {agent.name}
            </Typography>
            <CustomChip
              rounded
              skin='light'
              size='small'
              label={agent.type}
              color={roleColors[agent.role] || 'primary'}
              sx={{ textTransform: 'capitalize' }}
            />
          </CardContent>

          <CardContent sx={{ pt: theme => `${theme.spacing(2)} !important` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ mr: 8, display: 'flex', alignItems: 'center' }}>
                <CustomAvatar skin='light' variant='rounded' sx={{ mr: 2.5, width: 38, height: 38 }}>
                  <Icon fontSize='1.75rem' icon='tabler:activity' />
                </CustomAvatar>
                <div>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {agent.transaction_count?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant='body2'>Recent Activity</Typography>
                </div>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomAvatar skin='light' variant='rounded' sx={{ mr: 2.5, width: 38, height: 38 }}>
                  <Icon fontSize='1.75rem' icon='tabler:users' />
                </CustomAvatar>
                <div>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {agent.child_agents_count || 0}
                  </Typography>
                  <Typography variant='body2'>Associated Agents</Typography>
                </div>
              </Box>
            </Box>
          </CardContent>

          <Divider sx={{ my: '0 !important', mx: 6 }} />

          <CardContent sx={{ pb: 4 }}>
            <Typography variant='body2' sx={{ color: 'text.disabled', textTransform: 'uppercase' }}>
              Details
            </Typography>
            <Box sx={{ pt: 4 }}>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Username:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>@{agent.username || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Account No:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{agent.account_number}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Email:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{agent.email || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Status:</Typography>
                <CustomChip
                  rounded
                  skin='light'
                  size='small'
                  label={agent.status || (agent.is_active ? 'Active' : 'Inactive')}
                  color={statusColors[agent.status] || (agent.is_active ? 'success' : 'secondary')}
                  sx={{
                    textTransform: 'capitalize'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Role:</Typography>
                <Typography sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>{agent.role}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Contact:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{agent.contact || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Region:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{agent.region || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Zone:</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{agent.zone || 'N/A'}</Typography>
              </Box>
            </Box>
          </CardContent>

          <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button variant='contained' sx={{ mr: 2 }} onClick={handleEditClickOpen}>
              Edit
            </Button>
            <Button color='error' variant='tonal' onClick={() => setSuspendDialogOpen(true)}>
              Suspend
            </Button>
          </CardActions>

          <Dialog
            open={openEdit}
            onClose={handleEditClose}
            aria-labelledby='agent-view-edit'
            aria-describedby='agent-view-edit-description'
            sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 650 } }}
          >
            <DialogTitle
              id='agent-view-edit'
              sx={{
                textAlign: 'center',
                fontSize: '1.5rem !important',
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
                pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
              }}
            >
              Edit Agent Information
            </DialogTitle>
            <DialogContent
              sx={{
                pb: theme => `${theme.spacing(8)} !important`,
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`]
              }}
            >
              <DialogContentText variant='body2' id='agent-view-edit-description' sx={{ textAlign: 'center', mb: 7 }}>
                Updating agent details will receive a privacy audit.
              </DialogContentText>
              <form>
                <Grid container spacing={6}>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Full Name'
                      placeholder='John Doe'
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Username'
                      placeholder='john.doe'
                      value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position='start'>@</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='email'
                      label='Email'
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder='john.doe@gmail.com'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Phone'
                      placeholder='723-348-2344'
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Contact'
                      placeholder='Contact Info'
                      value={editForm.contact}
                      onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Role'
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <MenuItem value='agent'>Agent</MenuItem>
                      <MenuItem value='analyst'>Analyst</MenuItem>
                      <MenuItem value='admin'>Admin</MenuItem>
                      <MenuItem value='super_agent'>Super Agent</MenuItem>
                      <MenuItem value='franchise'>Franchise</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Region'
                      value={editForm.region}
                      onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Zone'
                      value={editForm.zone}
                      onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Account Number'
                      value={editForm.account_number}
                      onChange={e => setEditForm({ ...editForm, account_number: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Type'
                      value={editForm.type}
                      onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    >
                      <MenuItem value='agent'>Agent</MenuItem>
                      <MenuItem value='super_agent'>Super Agent</MenuItem>
                      <MenuItem value='franchise'>Franchise</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Branch Name'
                      value={editForm.branch_name}
                      onChange={e => setEditForm({ ...editForm, branch_name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Branch Code'
                      value={editForm.branch_code}
                      onChange={e => setEditForm({ ...editForm, branch_code: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </form>
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: 'center',
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
                pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
              }}
            >
              <Button variant='contained' sx={{ mr: 2 }} onClick={handleEditSubmit}>
                Submit
              </Button>
              <Button variant='tonal' color='secondary' onClick={handleEditClose}>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={suspendDialogOpen}
            onClose={() => setSuspendDialogOpen(false)}
            aria-labelledby='agent-view-suspend'
            aria-describedby='agent-view-suspend-description'
            sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 500 } }}
          >
            <DialogTitle
              id='agent-view-suspend'
              sx={{
                textAlign: 'center',
                fontSize: '1.5rem !important',
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
                pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
              }}
            >
              Suspend Agent
            </DialogTitle>
            <DialogContent
              sx={{
                pb: theme => `${theme.spacing(8)} !important`,
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`]
              }}
            >
              <DialogContentText
                variant='body2'
                id='agent-view-suspend-description'
                sx={{ textAlign: 'center', mb: 7 }}
              >
                Are you sure you want to suspend this agent? This action requires analyst approval.
              </DialogContentText>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label='Reason for Suspension'
                placeholder='Please provide a reason...'
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: 'center',
                px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
                pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
              }}
            >
              <Button variant='contained' color='error' sx={{ mr: 2 }} onClick={handleSuspend}>
                Suspend Agent
              </Button>
              <Button variant='tonal' color='secondary' onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ pb: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <CustomChip
              rounded
              skin='light'
              size='small'
              color={agent.commission_eligible ? 'success' : 'error'}
              label={agent.commission_eligible ? 'Commission Eligible' : 'Not Eligible'}
            />
            <Box sx={{ display: 'flex', position: 'relative' }}>
              <Sup>$</Sup>
              <Typography
                variant='h4'
                sx={{ mt: -1, mb: -1.2, color: 'primary.main', fontSize: '2.375rem !important' }}
              >
                {agent.payband || 1.0}
              </Typography>
              <Sub>x Payband</Sub>
            </Box>
          </CardContent>

          <CardContent>
            <Box sx={{ mt: 2.5, mb: 4 }}>
              <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', '& svg': { mr: 2, color: 'text.secondary' } }}>
                <Icon icon='tabler:coin' fontSize='1.125rem' />
                <Typography sx={{ color: 'text.secondary' }}>
                  {agent.commission_eligible
                    ? 'Eligible for commission payments'
                    : 'Not eligible for commission payments'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', '& svg': { mr: 2, color: 'text.secondary' } }}>
                <Icon icon='tabler:building-bank' fontSize='1.125rem' />
                <Typography sx={{ color: 'text.secondary' }}>
                  Branch: {agent.branch_name} ({agent.branch_code})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { mr: 2, color: 'text.secondary' } }}>
                <Icon icon='tabler:arrows-left-right' fontSize='1.125rem' />
                <Typography sx={{ color: 'text.secondary' }}>
                  {agent.transaction_count} transactions processed
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', mb: 1.5, justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 500 }}>Commission Progress</Typography>
              <Typography sx={{ fontWeight: 500 }}>{formatCurrency(agent.commission_amount)} earned</Typography>
            </Box>
            <LinearProgress
              value={Math.min((agent.commission_amount / 100000) * 100, 100)}
              variant='determinate'
              sx={{ height: 10 }}
            />
            <Typography sx={{ mt: 1.5, mb: 6, color: 'text.secondary' }}>Target: {formatCurrency(100000)}</Typography>
            <Button fullWidth variant='contained'>
              View Commission History
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AgentViewLeft
