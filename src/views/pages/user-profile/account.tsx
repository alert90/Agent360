import { useState, useEffect, ReactElement, SyntheticEvent } from 'react'
import axios from 'axios'

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
import Switch from '@mui/material/Switch'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hook Imports
import { useAuth } from 'src/hooks/useAuth'

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

// ** Demo Components
const UserAccountDetails = ({ user, onEdit }: { user: User; onEdit: () => void }) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: boolean): 'success' | 'error' | 'warning' | 'default' => {
    return status ? 'success' : 'error'
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>User Information</Typography>
              <Button variant='outlined' size='small' startIcon={<Icon icon='tabler:edit' />} onClick={onEdit}>
                Edit
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' fontWeight='bold'>
                {user.full_name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                @{user.username}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography variant='body2'>
                <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
              </Typography>
              <Typography variant='body2'>
                <strong>Status:</strong>{' '}
                <Chip
                  label={user.is_active ? 'Active' : 'Inactive'}
                  size='small'
                  color={getStatusColor(user.is_active)}
                />
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Location:</strong> {user.location || 'Not specified'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Zone:</strong> {user.zone || 'Not specified'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Account Activity
            </Typography>
            <Box>
              <Typography variant='body2'>
                <strong>Member Since:</strong> {formatDate(user.created_at)}
              </Typography>
              <Typography variant='body2'>
                <strong>Last Updated:</strong> {formatDate(user.updated_at)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

const UserActivities = ({ user }: { user: User }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Recent Activities
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          User activity tracking will be displayed here.
        </Typography>
      </CardContent>
    </Card>
  )
}

const UserInvoices = ({ user }: { user: User }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Transaction History
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          User transaction history will be displayed here.
        </Typography>
      </CardContent>
    </Card>
  )
}

const UserSecurity = ({ user }: { user: User }) => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [verificationForm, setVerificationForm] = useState({
    phone: '',
    email: ''
  })

  const handleChangePassword = async () => {
    console.log('Change password', passwordForm)
    setPasswordDialogOpen(false)
  }

  const handleAddVerification = async () => {
    console.log('Add verification', verificationForm)
    setVerificationDialogOpen(false)
  }

  return (
    <>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Password Management
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Change your account password regularly to maintain security.
              </Typography>
              <Button
                variant='outlined'
                startIcon={<Icon icon='tabler:key' />}
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Two-Factor Authentication
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Add an extra layer of security to your account.
              </Typography>
              <Button
                variant='outlined'
                startIcon={<Icon icon='tabler:shield-check' />}
                onClick={() => setVerificationDialogOpen(true)}
              >
                Add Verification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Device Management
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Monitor and manage devices logged into your account.
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Device</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Last Login</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>
                        <Box>
                          <Typography variant='body2' fontWeight='bold'>
                            Chrome on Windows
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Current Session
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>192.168.1.100</td>
                      <td style={{ padding: '12px' }}>Now</td>
                      <td style={{ padding: '12px' }}>
                        <Chip label='Active' size='small' color='success' />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <Button size='small' variant='outlined' color='error'>
                          Logout
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Current Password'
            type='password'
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label='New Password'
            type='password'
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label='Confirm New Password'
            type='password'
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant='contained' color='primary'>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Verification Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Add Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Choose a verification method for enhanced security.
          </Typography>
          <TextField
            fullWidth
            label='Phone Number'
            value={verificationForm.phone}
            onChange={e => setVerificationForm({ ...verificationForm, phone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label='Email Address'
            type='email'
            value={verificationForm.email}
            onChange={e => setVerificationForm({ ...verificationForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVerification} variant='contained' color='primary'>
            Add Verification
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const UserBilling = ({ user }: { user: User }) => {
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
                <strong>Current Plan:</strong>{' '}
                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')} Account
              </Typography>
              <Typography variant='body2'>
                <strong>Status:</strong>{' '}
                <Chip
                  label={user.is_active ? 'Active' : 'Inactive'}
                  size='small'
                  color={user.is_active ? 'success' : 'error'}
                />
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Account Details
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              User account information and settings.
            </Typography>
            <Box>
              <Typography variant='body2'>
                <strong>User ID:</strong> {user.id}
              </Typography>
              <Typography variant='body2'>
                <strong>Username:</strong> @{user.username}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

const UserNotifications = ({ user }: { user: User }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    whatsapp: true
  })

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotificationSettings({ ...notificationSettings, [type]: value })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Notification Preferences
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          Manage how you receive notifications for account activities.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>Email Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via email
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.email}
              onChange={e => handleNotificationChange('email', e.target.checked)}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>SMS Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via SMS
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.sms}
              onChange={e => handleNotificationChange('sms', e.target.checked)}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>WhatsApp Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via WhatsApp
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.whatsapp}
              onChange={e => handleNotificationChange('whatsapp', e.target.checked)}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

const UserConnections = ({ user }: { user: User }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          User Connections
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Network connections and relationships will be displayed here.
        </Typography>
      </CardContent>
    </Card>
  )
}

const UserAccountView = () => {
  // ** State
  const [activeTab, setActiveTab] = useState<string>('account-details')
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
    'account-details': <UserAccountDetails user={user!} onEdit={handleEdit} />,
    activities: <UserActivities user={user!} />,
    'invoice-list': <UserInvoices user={user!} />,
    security: <UserSecurity user={user!} />,
    'billing-plan': <UserBilling user={user!} />,
    notifications: <UserNotifications user={user!} />,
    connections: <UserConnections user={user!} />
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
      <Breadcrumbs sx={{ mb: 4 }}>
        <LinkStyled href='/'>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Dashboard
          </Typography>
        </LinkStyled>
        <LinkStyled href='/pages/user-profile/profile'>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Profile
          </Typography>
        </LinkStyled>
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          Account
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            {user.full_name}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Account Management - @{user.username}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            Status:
          </Typography>
          <Chip
            label={user.is_active ? 'Active' : 'Inactive'}
            size='small'
            color={user.is_active ? 'success' : 'error'}
          />
        </Box>
      </Box>

      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <TabList variant='scrollable' scrollButtons='auto' onChange={handleChange} aria-label='user account tabs'>
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

export default UserAccountView
