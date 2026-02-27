// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

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

interface AccountDetailsProps {
  user: User
  onEdit: () => void
}

const AccountDetails = ({ user, onEdit }: AccountDetailsProps) => {
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

export default AccountDetails
