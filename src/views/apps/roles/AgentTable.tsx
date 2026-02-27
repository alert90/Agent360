// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { SelectChangeEvent } from '@mui/material/Select'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Types
import { UsersType } from 'src/types/apps/userTypes'
import { ThemeColor } from 'src/@core/layouts/types'

// ** Custom Components Imports
import TableHeader from 'src/views/apps/roles/TableHeader'

interface UserRoleType {
  [key: string]: { icon: string; color: string }
}

interface UserStatusType {
  [key: string]: ThemeColor
}

interface CellType {
  row: UsersType
}

// ** Mock Data with all required properties
const userData: UsersType[] = [
  {
    id: 1,
    role: 'admin',
    email: 'admin@cyberwiz.world',
    status: 'active',
    avatar: '',
    avatarColor: 'error',
    billing: 'Auto Debit',
    fullName: 'Nicky Miles',
    username: 'ennexica',
    currentPlan: 'Enterprise',
    country: 'Tanzania',
    contact: '+255 123 456 789',
    company: 'CyberWiz',
    permissions: ['all'],
    joinDate: '2024-01-15'
  },
  {
    id: 2,
    role: 'analyst',
    email: 'analyst@cyberwiz.world',
    status: 'active',
    avatar: '',
    avatarColor: 'info',
    billing: 'Manual - Cash',
    fullName: 'Data Analyst',
    username: 'analyst',
    currentPlan: 'Team',
    country: 'Tanzania',
    contact: '+255 123 456 789',
    company: 'CyberWiz',
    permissions: ['read', 'analyze', 'export'],
    joinDate: '2024-01-16'
  },
  {
    id: 3,
    role: 'super_agent',
    email: 'sagent@cyberwiz.world',
    status: 'active',
    avatar: '',
    avatarColor: 'warning',
    billing: 'Manual - Cash',
    fullName: 'Super Agent John',
    username: 'sagent_john',
    currentPlan: 'Basic',
    country: 'Tanzania',
    contact: '+255 987 654 321',
    company: 'CyberWiz',
    permissions: ['manage_agents', 'view_reports', 'view_commissions'],
    joinDate: '2024-01-17'
  },
  {
    id: 4,
    role: 'franchise',
    email: 'franchise@cyberwiz.world',
    status: 'active',
    avatar: '',
    avatarColor: 'success',
    billing: 'Manual - Cash',
    fullName: 'Franchise Mary',
    username: 'franchise_mary',
    currentPlan: 'Basic',
    country: 'Tanzania',
    contact: '+255 987 654 321',
    company: 'CyberWiz',
    permissions: ['manage_agents', 'view_commissions', 'view_customers'],
    joinDate: '2024-01-18'
  },
  {
    id: 5,
    role: 'agent',
    email: 'agent1@cyberwiz.world',
    status: 'active',
    avatar: '',
    avatarColor: 'primary',
    billing: 'Manual - Cash',
    fullName: 'Agent David',
    username: 'agent_david',
    currentPlan: 'Basic',
    country: 'Tanzania',
    contact: '+255 789 123 456',
    company: 'CyberWiz',
    permissions: ['view_transactions', 'view_commissions'],
    joinDate: '2024-01-19'
  }
]

// ** Vars
const userRoleObj: UserRoleType = {
  admin: { icon: 'tabler:settings', color: 'error' },
  analyst: { icon: 'tabler:chart-bar', color: 'info' },
  super_agent: { icon: 'tabler:users', color: 'warning' },
  franchise: { icon: 'tabler:building-store', color: 'success' },
  agent: { icon: 'tabler:user', color: 'primary' }
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// ** renders client column
const renderClient = (row: UsersType) => {
  if (row.avatar.length) {
    return <CustomAvatar src={row.avatar} sx={{ mr: 3, width: 38, height: 38 }} />
  } else {
    return (
      <CustomAvatar
        skin='light'
        color={row.avatarColor as ThemeColor}
        sx={{ mr: 2.5, width: 38, height: 38, fontWeight: 500, fontSize: theme => theme.typography.body1.fontSize }}
      >
        {getInitials(row.fullName ? row.fullName : 'John Doe')}
      </CustomAvatar>
    )
  }
}

const columns: GridColDef[] = [
  {
    flex: 0.25,
    minWidth: 280,
    field: 'fullName',
    headerName: 'Agent',
    renderCell: ({ row }: CellType) => {
      const { fullName, email } = row

      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderClient(row)}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
            <Typography
              noWrap
              component={Link}
              href='/agents/view/account'
              sx={{
                fontWeight: 500,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {fullName}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
              {email}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.15,
    field: 'role',
    minWidth: 170,
    headerName: 'Region',
    renderCell: ({ row }: CellType) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar
            skin='light'
            sx={{ mr: 4, width: 30, height: 30 }}
            color={(userRoleObj[row.role].color as ThemeColor) || 'primary'}
          >
            <Icon icon={userRoleObj[row.role].icon} />
          </CustomAvatar>
          <Typography noWrap sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
            {row.role.replace('_', ' ')}
          </Typography>
        </Box>
      )
    }
  },
  {
    flex: 0.1,
    minWidth: 120,
    headerName: 'Zone',
    field: 'currentPlan',
    renderCell: ({ row }: CellType) => {
      return (
        <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary', textTransform: 'capitalize' }}>
          {row.currentPlan}
        </Typography>
      )
    }
  },
  {
    flex: 0.15,
    minWidth: 190,
    field: 'billing',
    headerName: 'Billing',
    renderCell: ({ row }: CellType) => {
      return (
        <Typography noWrap sx={{ color: 'text.secondary' }}>
          {row.billing}
        </Typography>
      )
    }
  },
  {
    flex: 0.1,
    minWidth: 110,
    field: 'status',
    headerName: 'Status',
    renderCell: ({ row }: CellType) => {
      return (
        <CustomChip
          rounded
          skin='light'
          size='small'
          label={row.status}
          color={userStatusObj[row.status]}
          sx={{ textTransform: 'capitalize' }}
        />
      )
    }
  },
  {
    flex: 0.1,
    minWidth: 100,
    sortable: false,
    field: 'actions',
    headerName: 'Actions',
    renderCell: () => (
      <IconButton component={Link} href='/agents/view/account'>
        <Icon icon='tabler:eye' />
      </IconButton>
    )
  }
]

const AgentList = () => {
  // ** State
  const [plan, setPlan] = useState<string>('')
  const [value, setValue] = useState<string>('')
  const [data, setData] = useState<UsersType[]>(userData)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  // ** Filter data based on search and plan
  useEffect(() => {
    let filteredData = userData

    // Filter by search value
    if (value) {
      filteredData = filteredData.filter(
        user =>
          user.fullName.toLowerCase().includes(value.toLowerCase()) ||
          user.email.toLowerCase().includes(value.toLowerCase()) ||
          user.username.toLowerCase().includes(value.toLowerCase())
      )
    }

    // Filter by plan
    if (plan) {
      filteredData = filteredData.filter(user => user.role === plan)
    }

    setData(filteredData)
  }, [value, plan])

  const handleFilter = (val: string) => {
    setValue(val)
  }

  const handlePlanChange = (e: SelectChangeEvent<unknown>) => {
    setPlan(e.target.value as string)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <TableHeader plan={plan} value={value} handleFilter={handleFilter} handlePlanChange={handlePlanChange} />
          <DataGrid
            autoHeight
            rowHeight={62}
            rows={data}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
          />
        </Card>
      </Grid>
    </Grid>
  )
}

export default AgentList
