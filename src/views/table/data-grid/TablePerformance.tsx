// src/views/table/data-grid/TablePerformance.tsx
import { useEffect, useState, useCallback, ChangeEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid, GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

// ** ThirdParty Components
import axios from 'axios'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Types Imports
import { ThemeColor } from 'src/@core/layouts/types'

type SortType = 'asc' | 'desc' | undefined | null

const columns: GridColDef[] = [
  {
    flex: 0.3,
    minWidth: 200,
    field: 'name',
    headerName: 'Agent Name',
    renderCell: (params: GridRenderCellParams) => {
      const { row } = params

      // Use consistent color based on agent type
      const color = row.type === 'super_agent' ? 'primary' : row.type === 'franchise' ? 'secondary' : 'info'

      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar
            skin='light'
            color={color as ThemeColor}
            sx={{ mr: 3, fontSize: '.8rem', width: '2rem', height: '2rem' }}
          >
            {getInitials(row.name || 'Unknown')}
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography noWrap variant='caption'>
              {row.accountNumber || 'N/A'}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.15,
    minWidth: 120,
    field: 'type',
    headerName: 'Type',
    renderCell: (params: GridRenderCellParams) => {
      const typeLabel = params.row.type?.replace('_', ' ') || 'local agent'
      const color =
        params.row.type === 'super_agent' ? 'primary' : params.row.type === 'franchise' ? 'secondary' : 'info'

      return (
        <CustomChip
          rounded
          size='small'
          skin='light'
          color={color}
          label={typeLabel.toUpperCase()}
          sx={{ '& .MuiChip-label': { textTransform: 'capitalize' } }}
        />
      )
    }
  },
  {
    flex: 0.15,
    minWidth: 120,
    field: 'transactions',
    headerName: 'Transactions',
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
        {params.row.transactions?.toLocaleString() || 0}
      </Typography>
    )
  },
  {
    flex: 0.2,
    minWidth: 150,
    field: 'totalAmount',
    headerName: 'Total Amount (TZS)',
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
        TZS {params.row.totalAmount?.toLocaleString() || 0}
      </Typography>
    )
  },
  {
    flex: 0.15,
    minWidth: 120,
    field: 'commissionAmount',
    headerName: 'Commission',
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant='body2' sx={{ color: 'success.main', fontWeight: 600 }}>
        TZS {params.row.commissionAmount?.toLocaleString() || 0}
      </Typography>
    )
  },
  {
    flex: 0.1,
    minWidth: 100,
    field: 'actions',
    headerName: 'Actions',
    sortable: false,
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <CustomChip
          rounded
          size='small'
          skin='light'
          color='primary'
          label='View'
          onClick={() => window.open(`/agents/view/${params.row.id}`, '_blank')}
          sx={{ cursor: 'pointer' }}
        />
      </Box>
    )
  }
]

const TablePerformance = () => {
  // ** States
  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('desc')
  const [rows, setRows] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [sortColumn, setSortColumn] = useState<string>('totalAmount')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [typeFilter, setTypeFilter] = useState<string>('')

  const fetchTableData = useCallback(
    async (sortDirection: SortType, search: string, column: string, page: number, pageSize: number, type: string) => {
      try {
        const response = await axios.get('/api/agents/performance', {
          params: {
            sortBy:
              column === 'totalAmount'
                ? 'totalAmount'
                : column === 'transactions'
                ? 'transactions'
                : 'commissionAmount',
            sortOrder: sortDirection === 'asc' ? 'asc' : 'desc',
            search,
            type,
            page: page + 1,
            limit: pageSize
          }
        })

        if (response.data.success) {
          setRows(response.data.data)
          setTotal(response.data.pagination.total)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      }
    },
    []
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, paginationModel.page, paginationModel.pageSize, typeFilter)
  }, [fetchTableData, searchValue, sort, sortColumn, paginationModel.page, paginationModel.pageSize, typeFilter])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort as SortType)
      setSortColumn(newModel[0].field)
    } else {
      setSort('desc')
      setSortColumn('totalAmount')
    }
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
  }

  return (
    <Card>
      <CardHeader
        title='Agent Performance Rankings'
        subheader='Best performing agents by transaction volume and count'
      />
      <DataGrid
        autoHeight
        pagination
        rows={rows}
        rowCount={total}
        columns={columns}
        sortingMode='server'
        paginationMode='server'
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={paginationModel}
        onSortModelChange={handleSortModel}
        onPaginationModelChange={setPaginationModel}
        slots={{ toolbar: ServerSideToolbar }}
        slotProps={{
          baseButton: {
            size: 'medium',
            variant: 'tonal'
          },
          toolbar: {
            value: searchValue,
            clearSearch: () => handleSearch(''),
            onChange: (event: ChangeEvent<HTMLInputElement>) => handleSearch(event.target.value),

            // Add type filter dropdown
            filterOptions: (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <CustomChip
                  size='small'
                  label='All'
                  color={typeFilter === '' ? 'primary' : 'default'}
                  onClick={() => handleTypeFilter('')}
                  sx={{ cursor: 'pointer' }}
                />
                <CustomChip
                  size='small'
                  label='Super Agents'
                  color={typeFilter === 'super_agent' ? 'primary' : 'default'}
                  onClick={() => handleTypeFilter('super_agent')}
                  sx={{ cursor: 'pointer' }}
                />
                <CustomChip
                  size='small'
                  label='Franchises'
                  color={typeFilter === 'franchise' ? 'primary' : 'default'}
                  onClick={() => handleTypeFilter('franchise')}
                  sx={{ cursor: 'pointer' }}
                />
                <CustomChip
                  size='small'
                  label='Local Agents'
                  color={typeFilter === 'local_agent' ? 'primary' : 'default'}
                  onClick={() => handleTypeFilter('local_agent')}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            )
          }
        }}
        initialState={{
          sorting: {
            sortModel: [{ field: 'totalAmount', sort: 'desc' }]
          }
        }}
      />
    </Card>
  )
}

export default TablePerformance
