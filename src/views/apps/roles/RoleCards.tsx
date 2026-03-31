// src/views/apps/roles/RoleCards.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import Checkbox from '@mui/material/Checkbox'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import DialogTitle from '@mui/material/DialogTitle'
import AvatarGroup from '@mui/material/AvatarGroup'
import CardContent from '@mui/material/CardContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'

import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

interface CardDataType {
  title: string
  role: string
  avatars: string[]
  totalUsers: number
  description: string
}

// Updated roles based on ACL configuration
const cardData: CardDataType[] = [
  {
    totalUsers: 1,
    title: 'Administrator',
    role: 'admin',
    avatars: ['1.png'],
    description: 'Full system access with all permissions'
  },
  {
    totalUsers: 3,
    title: 'Analyst',
    role: 'analyst',
    avatars: ['2.png', '3.png', '4.png'],
    description: 'Access to analytics, reports, and data insights'
  },
  {
    totalUsers: 5,
    title: 'Super Agent',
    role: 'super_agent',
    avatars: ['5.png', '6.png', '7.png', '8.png', '1.png'],
    description: 'Manage local agents with performance-based commission structure'
  },
  {
    totalUsers: 8,
    title: 'Franchise',
    role: 'franchise',
    avatars: ['2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '1.png'],
    description: 'Manage agents with turnover-based commission structure'
  },
  {
    totalUsers: 50,
    title: 'Regional Manager',
    role: 'regional_manager',
    avatars: ['4.png', '5.png'],
    description: 'Manage regional operations and agent performance'
  },
  {
    totalUsers: 150,
    title: 'Agent',
    role: 'agent',
    avatars: ['4.png', '5.png'],
    description: 'Basic access for transaction processing'
  }
]

// Permissions organized by module based on ACL subjects
const permissionsByModule = {
  dashboard: ['read', 'export'],
  analytics: ['read', 'analyze', 'export'],
  reports: ['read', 'export', 'analyze'],
  commissions: ['read', 'calculate', 'export'],
  'agent-management': ['read', 'create', 'update', 'delete'],
  customers: ['read', 'create', 'update'],
  transactions: ['read', 'export', 'void'],
  'user-management': ['read', 'create', 'update', 'delete'],
  'system-management': ['read', 'configure'],
  chat: ['read', 'send'],
  email: ['read', 'send'],
  faq: ['read', 'create', 'update'],
  'help-center': ['read', 'create', 'update'],
  calendar: ['read', 'create', 'update'],
  super_agent: ['read', 'manage'],
  franchise: ['read', 'manage'],
  regional_manager: ['read', 'manage']
}

const RoleCards = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [dialogTitle, setDialogTitle] = useState<'Add' | 'Edit'>('Add')
  const [selectedRole, setSelectedRole] = useState<CardDataType | null>(null)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({})
  const [usersCount, setUsersCount] = useState<Record<string, number>>({})

  // Fetch user counts from database
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const response = await fetch('/api/users/count-by-role')
        if (response.ok) {
          const data = await response.json()
          setUsersCount(data)
        }
      } catch (error) {
        console.error('Error fetching user counts:', error)
      }
    }

    fetchUserCounts()
  }, [])

  const handleClickOpen = (role?: CardDataType) => {
    if (role) {
      setSelectedRole(role)
      setRoleName(role.title)
      setDialogTitle('Edit')
      setSelectedPermissions({})
    } else {
      setSelectedRole(null)
      setRoleName('')
      setDialogTitle('Add')
      setSelectedPermissions({})
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedRole(null)
    setSelectedPermissions({})
  }

  const togglePermission = (module: string, permission: string) => {
    setSelectedPermissions(prev => {
      const current = prev[module] || []
      const updated = current.includes(permission) ? current.filter(p => p !== permission) : [...current, permission]

      const newPermissions = { ...prev, [module]: updated }
      if (updated.length === 0) {
        delete newPermissions[module]
      }

      return newPermissions
    })
  }

  const getModulePermissions = (module: string) => {
    return permissionsByModule[module as keyof typeof permissionsByModule] || []
  }

  const handleSelectAllModule = (module: string) => {
    const modulePermissions = getModulePermissions(module)
    const currentPermissions = selectedPermissions[module] || []
    const allSelected = modulePermissions.length > 0 && modulePermissions.every(p => currentPermissions.includes(p))

    if (allSelected) {
      setSelectedPermissions(prev => {
        const newPerms = { ...prev }
        delete newPerms[module]

        return newPerms
      })
    } else {
      setSelectedPermissions(prev => ({
        ...prev,
        [module]: modulePermissions
      }))
    }
  }

  const isModuleFullySelected = (module: string) => {
    const modulePermissions = getModulePermissions(module)
    const currentPermissions = selectedPermissions[module] || []

    return modulePermissions.length > 0 && modulePermissions.every(p => currentPermissions.includes(p))
  }

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = getModulePermissions(module)
    const currentPermissions = selectedPermissions[module] || []

    return currentPermissions.length > 0 && currentPermissions.length < modulePermissions.length
  }

  const handleSaveRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: dialogTitle === 'Add' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: roleName,
          role: roleName.toLowerCase().replace(/\s+/g, '_'),
          permissions: selectedPermissions,
          ...(selectedRole && { id: selectedRole.role })
        })
      })

      if (response.ok) {
        handleClose()
        window.location.reload()
      }
    } catch (error) {
      console.error('Error saving role:', error)
    }
  }

  const renderCards = () =>
    cardData.map((item, index: number) => (
      <Grid item xs={12} sm={6} lg={4} key={index}>
        <Card>
          <CardContent>
            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>
                {`Total ${usersCount[item.role] || item.totalUsers} users`}
              </Typography>
              <AvatarGroup
                max={4}
                className='pull-up'
                sx={{
                  '& .MuiAvatar-root': { width: 32, height: 32, fontSize: theme => theme.typography.body2.fontSize }
                }}
              >
                {item.avatars.map((img, idx: number) => (
                  <Avatar key={idx} alt={item.title} src={`/images/avatars/${img}`} />
                ))}
              </AvatarGroup>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary', mb: 1 }}>
                  {item.description}
                </Typography>
                <Typography
                  href='/'
                  component={Link}
                  sx={{ color: 'primary.main', textDecoration: 'none' }}
                  onClick={e => {
                    e.preventDefault()
                    handleClickOpen(item)
                  }}
                >
                  Edit Role
                </Typography>
              </Box>
              <IconButton size='small' sx={{ color: 'text.disabled' }}>
                <Icon icon='tabler:copy' />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))

  return (
    <Grid container spacing={6} className='match-height'>
      {renderCards()}
      <Grid item xs={12} sm={6} lg={4}>
        <Card sx={{ cursor: 'pointer' }} onClick={() => handleClickOpen()}>
          <Grid container sx={{ height: '100%' }}>
            <Grid item xs={5}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}
              >
                <img height={122} alt='add-role' src='/images/pages/add-new-role-illustration.png' />
              </Box>
            </Grid>
            <Grid item xs={7}>
              <CardContent sx={{ pl: 0, height: '100%' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Button variant='contained' sx={{ mb: 3, whiteSpace: 'nowrap' }} onClick={() => handleClickOpen()}>
                    Add New Role
                  </Button>
                  <Typography sx={{ color: 'text.secondary' }}>Add role, if it doesn't exist.</Typography>
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      </Grid>

      <Dialog fullWidth maxWidth='md' scroll='body' onClose={handleClose} open={open}>
        <DialogTitle
          component='div'
          sx={{
            textAlign: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Typography variant='h3'>{`${dialogTitle} Role`}</Typography>
          <Typography color='text.secondary'>Set Role Permissions</Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(5)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`]
          }}
        >
          <Box sx={{ my: 4 }}>
            <FormControl fullWidth>
              <CustomTextField
                fullWidth
                label='Role Name'
                placeholder='Enter Role Name'
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
              />
            </FormControl>
          </Box>

          <Typography variant='h4' sx={{ mb: 2 }}>
            Role Permissions
          </Typography>

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: '0 !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='h6'>Module</Typography>
                    </Box>
                  </TableCell>
                  <TableCell colSpan={4}>Permissions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(permissionsByModule).map(([module, permissions]) => {
                  const isFullySelected = isModuleFullySelected(module)
                  const isPartiallySelected = isModulePartiallySelected(module)

                  return (
                    <TableRow key={module}>
                      <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {module.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          label='Select All'
                          control={
                            <Checkbox
                              size='small'
                              checked={isFullySelected}
                              indeterminate={isPartiallySelected}
                              onChange={() => handleSelectAllModule(module)}
                            />
                          }
                        />
                      </TableCell>
                      {permissions.map(permission => (
                        <TableCell key={permission}>
                          <FormControlLabel
                            label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                            control={
                              <Checkbox
                                size='small'
                                checked={(selectedPermissions[module] || []).includes(permission)}
                                onChange={() => togglePermission(module, permission)}
                              />
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Box className='demo-space-x'>
            <Button type='submit' variant='contained' onClick={handleSaveRole}>
              Save Role
            </Button>
            <Button color='secondary' variant='tonal' onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default RoleCards
