// ** React Imports
import { useState } from 'react'

// ** MUI Components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
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

const AgentSecurity = ({ agent }: { agent: Agent }) => {
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
    // Implementation for password change
    console.log('Change password', passwordForm)
    setPasswordDialogOpen(false)
  }

  const handleAddVerification = async () => {
    // Implementation for adding verification
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
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>
                        <Box>
                          <Typography variant='body2' fontWeight='bold'>
                            Safari on iPhone
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Mobile Device
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>10.0.0.50</td>
                      <td style={{ padding: '12px' }}>2 hours ago</td>
                      <td style={{ padding: '12px' }}>
                        <Chip label='Inactive' size='small' color='default' />
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

export default AgentSecurity
