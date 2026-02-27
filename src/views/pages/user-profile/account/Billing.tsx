// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

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

interface BillingProps {
  user: User
}

const Billing = ({ user }: BillingProps) => {
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

export default Billing
