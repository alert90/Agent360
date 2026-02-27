// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Custom Components
import CustomTextField from 'src/@core/components/mui/text-field'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { UsersType, UserRole } from 'src/types/apps/userTypes'

const UserManagement = () => {
  const [users, setUsers] = useState<UsersType[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  useEffect(() => {
    // Mock data - replace with API call
    setUsers([
      {
        id: 1,
        role: 'admin',
        email: 'admin@cyberwiz.world',
        status: 'active',
        fullName: 'Nicky Miles',
        username: 'ennexica',
        country: 'Tanzania',
        contact: '+255 789 456 123',
        permissions: ['all'],
        joinDate: '2024-01-01'
      },
      {
        id: 2,
        role: 'analyst',
        email: 'analyst@cyberwiz.world',
        status: 'active',
        fullName: 'Data Analyst',
        username: 'analyst',
        country: 'Tanzania',
        contact: '+255 789 456 124',
        permissions: ['read', 'analyze', 'export'],
        joinDate: '2024-01-15'
      },
      {
        id: 3,
        role: 'super_agent',
        email: 'sagent@cyberwiz.world',
        status: 'active',
        fullName: 'Super Agent John',
        username: 'sagent_john',
        country: 'Tanzania',
        contact: '+255 789 456 125',
        location: 'Dar es Salaam',
        zone: 'Central',
        permissions: ['manage_agents', 'view_reports'],
        joinDate: '2024-02-01'
      }
    ])
  }, [])

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'error',
      analyst: 'info',
      super_agent: 'success',
      franchise: 'warning',
      agent: 'primary'
    }

    return colors[role]
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
      suspended: 'error'
    }

    return colors[status] || 'secondary'
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='User Management'
            action={
              <Button variant='contained' startIcon={<Icon icon='tabler:plus' />}>
                Add User
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  value={searchValue}
                  placeholder='Search users...'
                  onChange={e => setSearchValue(e.target.value)}
                  InputProps={{
                    startAdornment: <Icon icon='tabler:search' fontSize={20} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  select
                  fullWidth
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
                  SelectProps={{
                    displayEmpty: true
                  }}
                >
                  <option value='all'>All Roles</option>
                  <option value='admin'>Admin</option>
                  <option value='analyst'>Analyst</option>
                  <option value='super_agent'>Super Agent</option>
                  <option value='franchise'>Franchise</option>
                  <option value='agent'>Agent</option>
                </CustomTextField>
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              {users.map(user => (
                <Grid item xs={12} md={6} lg={4} key={user.id}>
                  <Card>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 2 }}>
                        {user.fullName}
                      </Typography>
                      <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
                        {user.email}
                      </Typography>
                      <Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
                        {user.contact}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item>
                          <CustomChip
                            rounded
                            skin='light'
                            size='small'
                            label={user.role}
                            color={getRoleColor(user.role)}
                          />
                        </Grid>
                        <Grid item>
                          <CustomChip
                            rounded
                            skin='light'
                            size='small'
                            label={user.status}
                            color={getStatusColor(user.status)}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button fullWidth variant='tonal' size='small' startIcon={<Icon icon='tabler:edit' />}>
                            Edit
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant='tonal'
                            color='secondary'
                            size='small'
                            startIcon={<Icon icon='tabler:settings' />}
                          >
                            Privileges
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default UserManagement
