import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Menu,
  Checkbox
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { GridColDef } from '@mui/x-data-grid'
import { format } from 'date-fns'

interface DataTableProps {
  data: any[]
  columns: GridColDef[]
  title: string
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onFilterChange?: (filters: Record<string, string>) => void
  searchPlaceholder?: string
  filterOptions?: Array<{
    field: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
  pagination?: {
    page: number
    pageSize: number
    totalRows: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  title,
  loading = false,
  onRefresh,
  onExport,
  onFilterChange,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  pagination
}) => {
  // Use server-side pagination if provided, otherwise use client-side
  const isServerSide = !!pagination
  const [page, setPage] = useState(isServerSide ? pagination.page + 1 : 1)
  const [rowsPerPage, setRowsPerPage] = useState(isServerSide ? pagination.pageSize : 25)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Filter and search data (only for client-side)
  const filteredData = useMemo(() => {
    if (isServerSide) return data // Don't filter client-side when using server pagination

    let filtered = [...data]

    // Apply search
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(row =>
        Object.values(row).some(value => String(value).toLowerCase().includes(searchLower))
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(row => String(row[field]) === value)
      }
    })

    return filtered
  }, [data, searchQuery, filters, isServerSide])

  // Paginated data
  const paginatedData = useMemo(() => {
    if (isServerSide) return data // Use server-provided data

    const startIndex = (page - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage

    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, page, rowsPerPage, data, isServerSide])

  const totalPages = isServerSide
    ? Math.ceil(pagination.totalRows / rowsPerPage)
    : Math.ceil(filteredData.length / rowsPerPage)

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = event.target.value
    setSearchQuery(newSearchQuery)
    setPage(1) // Reset to first page on search

    // For server-side, call onFilterChange with all filters
    if (isServerSide && onFilterChange) {
      onFilterChange({
        ...filters,
        search: newSearchQuery
      })
    }
  }

  const handleFilterChange = (field: string) => (event: any) => {
    const value = event.target.value
    const newFilters = {
      ...filters,
      [field]: value
    }
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter

    // For server-side, call onFilterChange
    if (isServerSide && onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (isServerSide && pagination) {
      pagination.onPageChange(value - 1) // Convert to 0-based index
    }
    setPage(value)
  }

  const handleRowsPerPageChange = (event: any) => {
    const newPageSize = parseInt(event.target.value, 10)
    if (isServerSide && pagination) {
      pagination.onPageSizeChange(newPageSize)
    }
    setRowsPerPage(newPageSize)
    setPage(1)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = paginatedData.map((_, index) => index)
      setSelectedRows(newSelecteds)
    } else {
      setSelectedRows([])
    }
  }

  const handleClick = (event: React.MouseEvent<unknown>, index: number) => {
    const selectedIndex = selectedRows.indexOf(index)
    let newSelected: number[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, index)
    } else {
      newSelected = selectedRows.filter(item => item !== index)
    }

    setSelectedRows(newSelected)
  }

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExportCSV = () => {
    if (onExport) {
      onExport()
    } else {
      // Default CSV export
      exportToCSV(filteredData, columns)
    }
    handleExportMenuClose()
  }

  const handleExportSelected = () => {
    const selectedData = selectedRows.map(index => paginatedData[index])
    exportToCSV(selectedData, columns)
    handleExportMenuClose()
  }

  const isSelected = (index: number) => selectedRows.indexOf(index) !== -1

  const formatCellValue = (value: any, column: GridColDef) => {
    if (column.valueFormatter && typeof column.valueFormatter === 'function') {
      return column.valueFormatter({ value, field: column.field, api: null as any })
    }

    if (column.type === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : value
    }

    if (column.type === 'date' && value) {
      try {
        return format(new Date(value), 'MMM dd, yyyy')
      } catch {
        return value
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS'
      }).format(value)
    }

    return value
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h5'>{title}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={<Icon icon='tabler:refresh' />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant='contained'
              startIcon={<Icon icon='tabler:download' />}
              onClick={handleExportMenuOpen}
              disabled={loading || filteredData.length === 0}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Icon icon='tabler:search' />
                </Box>
              )
            }}
            sx={{ maxWidth: 300 }}
          />

          {filterOptions.map(filter => (
            <FormControl key={filter.field} size='small' sx={{ minWidth: 150 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filters[filter.field] || 'all'}
                label={filter.label}
                onChange={handleFilterChange(filter.field)}
              >
                <MenuItem value='all'>All</MenuItem>
                {filter.options.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>

        {/* Results Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            Showing {paginatedData.length} of {filteredData.length} results
            {filteredData.length !== data.length && ` (from ${data.length} total)`}
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding='checkbox'>
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
                    checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {columns.map(column => (
                  <TableCell key={column.field} sx={{ fontWeight: 'bold', minWidth: column.minWidth || 120 }}>
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align='center'>
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align='center'>
                    <Typography>No data found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    hover
                    selected={isSelected(index)}
                    onClick={event => handleClick(event, index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding='checkbox'>
                      <Checkbox checked={isSelected(index)} />
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={column.field}>
                        {column.renderCell
                          ? column.renderCell({
                              id: row.id || index,
                              value: row[column.field],
                              row,
                              field: column.field,
                              colDef: column as any,
                              cellMode: 'view' as any,
                              hasFocus: false,
                              tabIndex: -1,
                              api: null as any,
                              rowNode: null as any
                            })
                          : formatCellValue(row[column.field], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              <MenuItem value={10}>10 rows</MenuItem>
              <MenuItem value={25}>25 rows</MenuItem>
              <MenuItem value={50}>50 rows</MenuItem>
              <MenuItem value={100}>100 rows</MenuItem>
            </Select>
          </FormControl>

          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>

        {/* Export Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleExportMenuClose}>
          <MenuItem onClick={handleExportCSV}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Icon icon='tabler:file-download' />
            </Box>
            Export All Data
          </MenuItem>
          <MenuItem onClick={handleExportSelected} disabled={selectedRows.length === 0}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Icon icon='tabler:file-export' />
            </Box>
            Export Selected ({selectedRows.length})
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}

// Helper function to export data to CSV
function exportToCSV(data: any[], columns: GridColDef[]) {
  if (data.length === 0) return

  // Create CSV content
  const headers = columns.map(col => col.headerName).join(',')
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = row[col.field]

        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }

        return value
      })
      .join(',')
  )

  const csvContent = [headers, ...rows].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default DataTable
