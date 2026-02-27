// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

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

interface SecurityProps {
  user: User
}

const Security = ({ user }: SecurityProps) => {
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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Device</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='center'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' fontWeight='bold'>
                            Chrome on Windows
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Current Session
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                          192.168.1.100
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>Now</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label='Active' size='small' color='success' />
                      </TableCell>
                      <TableCell align='center'>
                        <Button size='small' variant='outlined' color='error'>
                          Logout
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
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

export default Security
