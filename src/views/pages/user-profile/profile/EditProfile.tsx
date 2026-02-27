// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { ProfileTabCommonType } from 'src/@fake-db/types'

interface EditProfileProps {
  initialData: {
    about: ProfileTabCommonType[]
    contacts: ProfileTabCommonType[]
  }
  onSave: (updatedData: any) => void
  onCancel: () => void
}

const EditProfile = ({ initialData, onSave, onCancel }: EditProfileProps) => {
  // ** States
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    location: '',
    zone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Initialize form data
  useEffect(() => {
    const aboutData = initialData.about.reduce((acc: any, item) => {
      acc[item.property.toLowerCase().replace(' ', '')] = item.value

      return acc
    }, {})

    const contactsData = initialData.contacts.reduce((acc: any, item) => {
      acc[item.property.toLowerCase().replace(' ', '')] = item.value

      return acc
    }, {})

    setFormData({
      fullName: aboutData.fullname || '',
      username: contactsData.username || '',
      email: contactsData.email || '',
      location: aboutData.location || '',
      zone: aboutData.zone || ''
    })
  }, [initialData])

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/pages/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      setSuccess(true)
      onSave(data.user)

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Edit Profile'
        action={
          <Button variant='outlined' onClick={onCancel} startIcon={<Icon icon='tabler:x' />}>
            Cancel
          </Button>
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Full Name'
                value={formData.fullName}
                onChange={handleChange('fullName')}
                placeholder='Enter your full name'
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Username'
                value={formData.username}
                onChange={handleChange('username')}
                placeholder='Enter your username'
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Email'
                value={formData.email}
                disabled
                helperText='Email cannot be changed'
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 4, mt: 2 }}>
                Location Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Location'
                value={formData.location}
                onChange={handleChange('location')}
                placeholder='Enter your location'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Zone'
                value={formData.zone}
                onChange={handleChange('zone')}
                placeholder='Enter your zone'
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  gap: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  mt: 4
                }}
              >
                <Button
                  type='submit'
                  variant='contained'
                  disabled={loading}
                  startIcon={
                    loading ? <Icon icon='tabler:loader-2' className='rotate' /> : <Icon icon='tabler:device-floppy' />
                  }
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>

      {/* Success Message */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(false)} severity='success' sx={{ width: '100%' }}>
          Profile updated successfully!
        </Alert>
      </Snackbar>

      {/* Error Message */}
      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Card>
  )
}

export default EditProfile
