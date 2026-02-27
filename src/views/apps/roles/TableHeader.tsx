// ** MUI Imports
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import { SelectChangeEvent } from '@mui/material/Select'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

interface TableHeaderProps {
  plan: string
  value: string
  handleFilter: (val: string) => void
  handlePlanChange: (e: SelectChangeEvent<unknown>) => void
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { plan, handlePlanChange, handleFilter, value } = props

  return (
    <Box
      sx={{
        p: 5,
        pb: 3,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <CustomTextField
          value={value}
          sx={{ mr: 4, mb: 2 }}
          placeholder='Search User'
          onChange={e => handleFilter(e.target.value)}
        />
        <CustomTextField
          select
          value={plan}
          sx={{ mb: 2 }}
          defaultValue='Select Plan'
          SelectProps={{ displayEmpty: true, value: plan, onChange: e => handlePlanChange(e) }}
        >
          <MenuItem value=''>Select Role</MenuItem>
          <MenuItem value='admin'>Admin</MenuItem>
          <MenuItem value='analyst'>Analyst</MenuItem>
          <MenuItem value='super_agent'>Super Agent</MenuItem>
          <MenuItem value='franchise'>Franchise</MenuItem>
        </CustomTextField>
      </Box>
    </Box>
  )
}

export default TableHeader
