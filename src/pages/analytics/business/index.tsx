// ** React Imports
import { useState, useEffect, forwardRef } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { SelectChangeEvent } from '@mui/material/Select'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import format from 'date-fns/format'

//import DatePicker from 'react-datepicker'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'
import { TransactionType, TransactionStatus, TransactionTypeEnum } from 'src/types/apps/transactionsTypes'

//import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

interface TransactionStatusObj {
  [key: string]: {
    color: ThemeColor
    icon: string
  }
}

interface CustomInputProps {
  dates: Date[]
  label: string
  end: number | Date
  start: number | Date
  setDates?: (value: Date[]) => void
}

interface CellType {
  row: TransactionType
}

// ** Mock transaction data
const defaultTransactions: TransactionType[] = [
  {
    id: 'TXN001',
    agentId: 'AGT001',
    agentName: 'John Agent',
    customerName: 'Alice Customer',
    customerPhone: '+255123456789',
    type: 'deposit',
    amount: 100000,
    fee: 500,
    netAmount: 99500,
    timestamp: '2024-01-15 10:30:00',
    initiatedBy: 'customer',
    commissionEligible: true,
    commissionAmount: 1000,
    status: 'completed',
    location: 'Dar es Salaam',
    zone: 'Central',
    reference: 'REF001'
  },
  {
    id: 'TXN002',
    agentId: 'AGT002',
    agentName: 'Jane Agent',
    customerName: 'Bob Customer',
    customerPhone: '+255987654321',
    type: 'withdrawal',
    amount: 50000,
    fee: 300,
    netAmount: 49700,
    timestamp: '2024-01-15 14:20:00',
    initiatedBy: 'customer',
    commissionEligible: true,
    commissionAmount: 500,
    status: 'completed',
    location: 'Arusha',
    zone: 'Northern',
    reference: 'REF002'
  },
  {
    id: 'TXN003',
    agentId: 'AGT003',
    agentName: 'Mike Agent',
    customerName: 'Carol Customer',
    customerPhone: '+255555123456',
    type: 'transfer',
    amount: 75000,
    fee: 400,
    netAmount: 74600,
    timestamp: '2024-01-16 09:15:00',
    initiatedBy: 'agent',
    commissionEligible: false,
    commissionAmount: 0,
    status: 'pending',
    location: 'Mwanza',
    zone: 'Lake',
    reference: 'REF003'
  },
  {
    id: 'TXN004',
    agentId: 'AGT001',
    agentName: 'John Agent',
    customerName: 'David Customer',
    customerPhone: '+255444567890',
    type: 'payment',
    amount: 25000,
    fee: 200,
    netAmount: 24800,
    timestamp: '2024-01-16 16:45:00',
    initiatedBy: 'customer',
    commissionEligible: true,
    commissionAmount: 250,
    status: 'failed',
    location: 'Dar es Salaam',
    zone: 'Central',
    reference: 'REF004'
  }
]

// ** Vars
const transactionStatusObj: TransactionStatusObj = {
  completed: { color: 'success', icon: 'tabler:circle-check' },
  pending: { color: 'warning', icon: 'tabler:clock' },
  failed: { color: 'error', icon: 'tabler:alert-circle' },
  cancelled: { color: 'secondary', icon: 'tabler:x' }
}

const transactionTypeObj: Record<TransactionTypeEnum, { color: ThemeColor; label: string }> = {
  deposit: { color: 'success', label: 'Deposit' },
  withdrawal: { color: 'error', label: 'Withdrawal' },
  transfer: { color: 'info', label: 'Transfer' },
  payment: { color: 'primary', label: 'Payment' }
}

const defaultColumns: GridColDef[] = [
  {
    flex: 0.1,
    field: 'id',
    minWidth: 120,
    headerName: 'Transaction ID',
    renderCell: ({ row }: CellType) => (
      <Typography
        component={Link}
        href={`/transactions/list/${row.id}`}
        sx={{ color: 'text.secondary', fontWeight: 500, textDecoration: 'none' }}
      >
        {row.id}
      </Typography>
    )
  },
  {
    flex: 0.1,
    minWidth: 100,
    field: 'status',
    headerName: 'Status',
    renderCell: ({ row }: CellType) => {
      const status = transactionStatusObj[row.status]

      return (
        <CustomChip
          rounded
          size='small'
          skin='light'
          color={status.color}
          label={row.status}
          sx={{ textTransform: 'capitalize' }}
        />
      )
    }
  },
  {
    flex: 0.15,
    field: 'agentName',
    minWidth: 180,
    headerName: 'Agent',
    renderCell: ({ row }: CellType) => (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {row.agentName}
        </Typography>
        <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
          {row.agentId}
        </Typography>
      </Box>
    )
  },
  {
    flex: 0.15,
    field: 'customerName',
    minWidth: 180,
    headerName: 'Customer',
    renderCell: ({ row }: CellType) => (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {row.customerName}
        </Typography>
        <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
          {row.customerPhone}
        </Typography>
      </Box>
    )
  },
  {
    flex: 0.1,
    minWidth: 120,
    field: 'type',
    headerName: 'Type',
    renderCell: ({ row }: CellType) => {
      const type = transactionTypeObj[row.type]

      return <CustomChip rounded size='small' skin='light' color={type.color} label={type.label} />
    }
  },
  {
    flex: 0.1,
    minWidth: 120,
    field: 'amount',
    headerName: 'Amount',
    renderCell: ({ row }: CellType) => (
      <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>TZS {row.amount.toLocaleString()}</Typography>
    )
  },
  {
    flex: 0.1,
    minWidth: 120,
    field: 'commissionAmount',
    headerName: 'Commission',
    renderCell: ({ row }: CellType) => (
      <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
        TZS {row.commissionAmount.toLocaleString()}
      </Typography>
    )
  },
  {
    flex: 0.15,
    minWidth: 160,
    field: 'timestamp',
    headerName: 'Date & Time',
    renderCell: ({ row }: CellType) => <Typography sx={{ color: 'text.secondary' }}>{row.timestamp}</Typography>
  },
  {
    flex: 0.1,
    minWidth: 120,
    field: 'location',
    headerName: 'Location',
    renderCell: ({ row }: CellType) => <Typography sx={{ color: 'text.secondary' }}>{row.location}</Typography>
  }
]

/* eslint-disable */
const CustomInput = forwardRef((props: CustomInputProps, ref) => {
  const startDate = props.start !== null ? format(props.start, 'MM/dd/yyyy') : ''
  const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null

  const value = `${startDate}${endDate !== null ? endDate : ''}`
  props.start === null && props.dates.length && props.setDates ? props.setDates([]) : null
  const updatedProps = { ...props }
  delete updatedProps.setDates

  return <CustomTextField fullWidth inputRef={ref} {...updatedProps} label={props.label || ''} value={value} />
})
/* eslint-enable */

const BusinessAnalytics = () => {
  // ** State
  // const [dates, setDates] = useState<Date[]>([])
  const [value, setValue] = useState<string>('')
  const [statusValue, setStatusValue] = useState<TransactionStatus | ''>('')
  const [typeValue, setTypeValue] = useState<TransactionTypeEnum | ''>('')

  // const [endDateRange, setEndDateRange] = useState<DateType>(null)
  // const [startDateRange, setStartDateRange] = useState<DateType>(null)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [data, setData] = useState<TransactionType[]>(defaultTransactions)

  // ** Filter data based on search and filters
  useEffect(() => {
    let filteredData = defaultTransactions

    // Filter by search value
    if (value) {
      filteredData = filteredData.filter(
        transaction =>
          transaction.agentName.toLowerCase().includes(value.toLowerCase()) ||
          transaction.customerName.toLowerCase().includes(value.toLowerCase()) ||
          transaction.customerPhone.includes(value) ||
          transaction.id.toLowerCase().includes(value.toLowerCase())
      )
    }

    // Filter by status
    if (statusValue) {
      filteredData = filteredData.filter(transaction => transaction.status === statusValue)
    }

    // Filter by type
    if (typeValue) {
      filteredData = filteredData.filter(transaction => transaction.type === typeValue)
    }

    setData(filteredData)
  }, [value, statusValue, typeValue])

  const handleFilter = (val: string) => {
    setValue(val)
  }

  const handleStatusValue = (e: SelectChangeEvent<unknown>) => {
    setStatusValue(e.target.value as TransactionStatus)
  }

  const handleTypeValue = (e: SelectChangeEvent<unknown>) => {
    setTypeValue(e.target.value as TransactionTypeEnum)
  }

  // const handleOnChangeRange = (dates: any) => {
  //   const [start, end] = dates
  //   if (start !== null && end !== null) {
  //     setDates(dates)
  //   }
  //   setStartDateRange(start)
  //   setEndDateRange(end)
  // }

  const handleViewDetails = (transactionId: string) => {
    // Navigate to transaction details
    window.location.href = `/transactions/list/${transactionId}`
  }

  const handleEdit = (transactionId: string) => {
    // Implement edit functionality
    console.log('Edit transaction:', transactionId)
  }

  const handleRefund = (transactionId: string) => {
    // Implement refund functionality
    console.log('Refund transaction:', transactionId)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export transactions')
  }

  const handleMenuClick = (action: string, transactionId: string) => {
    switch (action) {
      case 'edit':
        handleEdit(transactionId)
        break
      case 'refund':
        handleRefund(transactionId)
        break
      case 'export':
        handleExport()
        break
      default:
        break
    }
  }

  const columns: GridColDef[] = [
    ...defaultColumns,
    {
      flex: 0.1,
      minWidth: 100,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }: CellType) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title='View Details'>
            <IconButton size='small' sx={{ color: 'text.secondary' }} onClick={() => handleViewDetails(row.id)}>
              <Icon icon='tabler:eye' />
            </IconButton>
          </Tooltip>
          <OptionsMenu
            menuProps={{ sx: { '& .MuiMenuItem-root svg': { mr: 2 } } }}
            iconButtonProps={{ size: 'small', sx: { color: 'text.secondary' } }}
            options={[
              {
                text: 'Edit',
                icon: <Icon icon='tabler:edit' fontSize={20} />,
                menuItemProps: {
                  onClick: () => handleMenuClick('edit', row.id)
                }
              },
              {
                text: 'Refund',
                icon: <Icon icon='tabler:refresh' fontSize={20} />,
                menuItemProps: {
                  onClick: () => handleMenuClick('refund', row.id)
                }
              },
              {
                text: 'Export',
                icon: <Icon icon='tabler:download' fontSize={20} />,
                menuItemProps: {
                  onClick: () => handleMenuClick('export', row.id)
                }
              }
            ]}
          />
        </Box>
      )
    }
  ]

  return (
    <DatePickerWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Business Analytics' />
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={4}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Status'
                    SelectProps={{ value: statusValue, onChange: e => handleStatusValue(e) }}
                  >
                    <MenuItem value=''>All Status</MenuItem>
                    <MenuItem value='completed'>Completed</MenuItem>
                    <MenuItem value='pending'>Pending</MenuItem>
                    <MenuItem value='failed'>Failed</MenuItem>
                    <MenuItem value='cancelled'>Cancelled</MenuItem>
                  </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Business Type'
                    SelectProps={{ value: typeValue, onChange: e => handleTypeValue(e) }}
                  >
                    <MenuItem value=''>All Types</MenuItem>
                    <MenuItem value='deposit'>Deposit</MenuItem>
                    <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                    <MenuItem value='transfer'>Transfer</MenuItem>
                    <MenuItem value='payment'>Payment</MenuItem>
                  </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Zone'
                    SelectProps={{ value: typeValue, onChange: e => handleTypeValue(e) }}
                  >
                    <MenuItem value=''>All Types</MenuItem>
                    <MenuItem value='deposit'>Deposit</MenuItem>
                    <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                    <MenuItem value='transfer'>Transfer</MenuItem>
                    <MenuItem value='payment'>Payment</MenuItem>
                  </CustomTextField>
                </Grid>
                {/* <Grid item xs={12} sm={4}>
                  <DatePicker
                    isClearable
                    selectsRange
                    monthsShown={2}
                    endDate={endDateRange}
                    selected={startDateRange}
                    startDate={startDateRange}
                    shouldCloseOnSelect={false}
                    id='date-range-picker-months'
                    onChange={handleOnChangeRange}
                    customInput={
                      <CustomInput
                        dates={dates}
                        setDates={setDates}
                        label='Transaction Date'
                        end={endDateRange as number | Date}
                        start={startDateRange as number | Date}
                      />
                    }
                  />
                </Grid> */}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box
              sx={{
                p: 5,
                pb: 3,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <CustomTextField
                value={value}
                placeholder='Search'
                onChange={e => handleFilter(e.target.value)}
                sx={{ mr: 4, mb: 2, width: '300px' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title='Export'>
                  <IconButton onClick={handleExport}>
                    <Icon icon='tabler:download' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Filter'>
                  <IconButton>
                    <Icon icon='tabler:filter' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <DataGrid
              autoHeight
              pagination
              rowHeight={62}
              rows={data}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
            />
          </Card>
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

BusinessAnalytics.acl = {
  action: 'read',
  subject: 'analytics'
}

export default BusinessAnalytics
