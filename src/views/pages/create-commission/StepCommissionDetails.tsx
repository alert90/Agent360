// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Types
import { UsersType } from 'src/types/apps/userTypes'

const StepCommissionDetails = ({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) => {
  const [users, setUsers] = useState<UsersType[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch users for selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/apps/users/list')
        const userData = await response.json()

        // API returns { users: [...], ... } so we need to extract the users array
        setUsers(userData.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleUserSelection = (userId: number, checked: boolean) => {
    const currentUsers = formData.assignedUsers || []
    if (checked) {
      setFormData({ ...formData, assignedUsers: [...currentUsers, userId] })
    } else {
      setFormData({ ...formData, assignedUsers: currentUsers.filter((id: number) => id !== userId) })
    }
  }

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 3 }}>
          Commission Configuration Details
        </Typography>
        <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
          Configure the basic settings for your commission system including titles, dates, and status.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <CustomTextField
          fullWidth
          label='Commission Title'
          placeholder='October Monthly Commission'
          value={formData.title || ''}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          helperText='Descriptive name for this commission configuration'
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CustomTextField
          fullWidth
          label='Commission Code'
          placeholder='COMM_2026'
          value={formData.code || ''}
          onChange={e => setFormData({ ...formData, code: e.target.value })}
          helperText='Unique identifier for this configuration'
        />
      </Grid>

      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          multiline
          minRows={3}
          label='Commission Description'
          placeholder='Commission calculation rules for January 2026'
          value={formData.description || ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          helperText='Detailed description of this commission configuration'
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <CustomTextField
          select
          fullWidth
          label='Configuration Status'
          value={formData.status || 'active'}
          onChange={e => setFormData({ ...formData, status: e.target.value })}
          helperText='Current status of this commission configuration'
        >
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
          <option value='suspended'>Suspended</option>
        </CustomTextField>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 3, mt: 4 }}>
          Assign to Specific Users (Optional)
        </Typography>
        <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
          Select specific users who can use this commission configuration. If no users are selected, it will be
          available to all users.
        </Typography>

        {loading ? (
          <Typography>Loading users...</Typography>
        ) : (
          <Grid container spacing={2}>
            {users.map(user => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={(formData.assignedUsers || []).includes(user.id)}
                      onChange={e => handleUserSelection(user.id, e.target.checked)}
                    />
                  }
                  label={`${user.fullName} (${user.email})`}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default StepCommissionDetails
