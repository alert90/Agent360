// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Components
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import axios from 'axios'
import { format } from 'date-fns'

// ** Types Imports
import { ThemeColor } from 'src/@core/layouts/types'

interface TransactionRowType {
  id: number
  transactionId: string
  agentName: string
  customerName: string
  type: string
  amount: number
  status: string
  zone: string
  timestamp: string
}

interface CellType {
  row: TransactionRowType
}

// ** renders status column
const renderStatus = (status: string) => {
  let color: ThemeColor = 'secondary'
  if (status === 'completed') color = 'success'
  else if (status === 'pending') color = 'warning'
  else if (status === 'failed') color = 'error'

  return (
    <Chip
      label={status.toUpperCase()}
      color={color}
      size='small'
      variant='outlined'
      sx={{ fontSize: '0.75rem', fontWeight: 500 }}
    />
  )
}

// ** renders amount column
const renderAmount = (amount: number, type: string) => {
  const isCredit = ['deposit', 'transfer'].includes(type)
  const color = isCredit ? 'success.main' : 'error.main'
  const prefix = isCredit ? '+' : '-'

  return (
    <Typography sx={{ color, fontWeight: 600 }}>
      {prefix} {amount.toLocaleString()}
    </Typography>
  )
}

const columns: GridColDef[] = [
  {
    flex: 0.15,
    field: 'transactionId',
    minWidth: 140,
    headerName: 'Transaction ID',
    renderCell: ({ row }: CellType) => (
      <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>{row.transactionId}</Typography>
    )
  },
  {
    flex: 0.12,
    field: 'agentName',
    minWidth: 120,
    headerName: 'Agent',
    renderCell: ({ row }: CellType) => <Typography sx={{ color: 'text.secondary' }}>{row.agentName}</Typography>
  },
  {
    flex: 0.12,
    field: 'customerName',
    minWidth: 120,
    headerName: 'Customer',
    renderCell: ({ row }: CellType) => <Typography sx={{ color: 'text.secondary' }}>{row.customerName}</Typography>
  },
  {
    flex: 0.08,
    field: 'type',
    minWidth: 100,
    headerName: 'Type',
    renderCell: ({ row }: CellType) => (
      <Chip label={row.type.toUpperCase()} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
    )
  },
  {
    flex: 0.1,
    field: 'amount',
    minWidth: 110,
    headerName: 'Amount',
    renderCell: ({ row }: CellType) => renderAmount(row.amount, row.type)
  },
  {
    flex: 0.08,
    field: 'status',
    minWidth: 90,
    headerName: 'Status',
    renderCell: ({ row }: CellType) => renderStatus(row.status)
  },
  {
    flex: 0.1,
    field: 'zone',
    minWidth: 100,
    headerName: 'Zone',
    renderCell: ({ row }: CellType) => <Typography sx={{ color: 'text.secondary' }}>{row.zone}</Typography>
  },
  {
    flex: 0.12,
    field: 'timestamp',
    minWidth: 140,
    headerName: 'Date & Time',
    renderCell: ({ row }: CellType) => (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
        {format(new Date(row.timestamp), 'dd MMM yyyy HH:mm')}
      </Typography>
    )
  }
]

const AnalyticsTransaction = () => {
  // ** State
  const [data, setData] = useState<TransactionRowType[]>([])
  const [loading, setLoading] = useState(true)
  const [value, setValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get authentication token
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.get('/api/transactions/list', {
          headers,
          params: {
            page: 1,
            limit: 100,
            sortBy: 'timestamp',
            sortOrder: 'desc'
          }
        })

        if (response.data.success) {
          // Transactions are already sorted from latest to oldest by the API
          setData(response.data.data)
        } else {
          setData([])
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredData = data.filter(
    transaction =>
      transaction.transactionId.toLowerCase().includes(value.toLowerCase()) ||
      transaction.agentName.toLowerCase().includes(value.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(value.toLowerCase()) ||
      transaction.zone.toLowerCase().includes(value.toLowerCase())
  )

  const handleFilter = (val: string) => {
    setValue(val)
  }

  return (
    <Card>
      <CardHeader
        title='Recent Transactions'
        titleTypographyProps={{ sx: { mb: [2, 0] } }}
        action={
          <CustomTextField
            value={value}
            placeholder='Search transactions...'
            onChange={e => handleFilter(e.target.value)}
          />
        }
        sx={{
          py: 4,
          flexDirection: ['column', 'row'],
          '& .MuiCardHeader-action': { m: 0 },
          alignItems: ['flex-start', 'center']
        }}
      />
      <DataGrid
        autoHeight
        loading={loading}
        pagination
        rows={filteredData}
        rowHeight={62}
        columns={columns}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        disableRowSelectionOnClick
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortingMode='client'
        filterMode='client'
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderBottomColor: 'divider'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'black.50'
          }
        }}
      />
    </Card>
  )
}

export default AnalyticsTransaction
