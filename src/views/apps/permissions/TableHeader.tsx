// src/views/apps/commission/TableHeader.tsx
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { SelectChangeEvent } from '@mui/material/Select'

import CustomTextField from 'src/@core/components/mui/text-field'
import Icon from 'src/@core/components/icon'

interface TableHeaderProps {
  value: string
  typeFilter: string
  handleFilter: (val: string) => void
  handleTypeFilterChange: (e: SelectChangeEvent<unknown>) => void
  toggleAddCommission: () => void
}

const TableHeader = (props: TableHeaderProps) => {
  const { value, typeFilter, handleFilter, handleTypeFilterChange, toggleAddCommission } = props

  return (
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <CustomTextField
          value={value}
          sx={{ minWidth: 250 }}
          placeholder='Search Commission'
          onChange={e => handleFilter(e.target.value)}
        />
        <CustomTextField
          select
          value={typeFilter}
          sx={{ minWidth: 180 }}
          placeholder='Filter by Type'
          SelectProps={{
            displayEmpty: true,
            value: typeFilter,
            onChange: handleTypeFilterChange
          }}
        >
          <MenuItem value=''>All Types</MenuItem>
          <MenuItem value='SUPER_AGENT'>Super Agent</MenuItem>
          <MenuItem value='FRANCHISE'>Franchise</MenuItem>
        </CustomTextField>
      </Box>
      <Button variant='contained' onClick={toggleAddCommission} startIcon={<Icon icon='tabler:plus' />}>
        Add Commission
      </Button>
    </Box>
  )
}

export default TableHeader
