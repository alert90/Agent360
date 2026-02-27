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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hook Imports
import { useAuth } from 'src/hooks/useAuth'

// ** Demo Components
import AccountDetails from 'src/views/pages/user-profile/account/AccountDetails'
import Activities from 'src/views/pages/user-profile/account/Activities'
import Invoices from 'src/views/pages/user-profile/account/Invoices'
import Security from 'src/views/pages/user-profile/account/Security'
import Billing from 'src/views/pages/user-profile/account/Billing'
import Notifications from 'src/views/pages/user-profile/account/Notifications'
import Connections from 'src/views/pages/user-profile/account/Connections'

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

// ** Type
interface User {
  id: number
  email: string
  full_name: string
  username: string
  role: string
  location?: string
  zone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AccountTabProps {
  tab?: string
}

const AccountTab = ({ tab = 'account-details' }: AccountTabProps) => {
  // ** State
  const [activeTab, setActiveTab] = useState<string>(tab)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    email: '',
    location: '',
    zone: ''
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // ** Hooks
  const router = useRouter()
  const { user: authUser } = useAuth()
  const hideText = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return

      setIsLoading(true)
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          console.error('No authentication token found')

          return
        }

        const response = await axios.get('/api/pages/profile?tab=account', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.data) {
          setUser(response.data)
        }
      } catch (error: any) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [authUser])

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const handleEdit = () => {
    if (!user) return
    setEditForm({
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      location: user.location || '',
      zone: user.zone || ''
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const updateData = {
        fullName: editForm.full_name,
        username: editForm.username,
        location: editForm.location,
        zone: editForm.zone
      }

      const response = await axios.put('/api/pages/profile/update', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.user) {
        setUser((prev: any) => ({ ...prev!, ...response.data.user }))
        setEditDialogOpen(false)
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success'
        })
      } else {
        throw new Error(response.data.message || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev: any) => ({ ...prev, open: false }))
  }

  const tabContentList: { [key: string]: ReactElement } = {
    'account-details': <AccountDetails user={user!} onEdit={handleEdit} />,
    activities: <Activities user={user!} />,
    'invoice-list': <Invoices user={user!} />,
    security: <Security user={user!} />,
    'billing-plan': <Billing user={user!} />,
    notifications: <Notifications user={user!} />,
    connections: <Connections user={user!} />
  }

  if (isLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <TabList variant='scrollable' scrollButtons='auto' onChange={handleChange} aria-label='account tabs'>
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
                {user && tabContentList[activeTab]}
              </TabPanel>
            )}
          </Grid>
        </Grid>
      </TabContext>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Full Name'
                value={editForm.full_name}
                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
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
                label='Location'
                value={editForm.location}
                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant='contained' color='primary'>
            Update Profile
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

export default AccountTab
