// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Demo Components Imports
import TablePerformance from 'src/views/table/data-grid/TablePerformance'

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

const AgentPerformance = () => {
  return (
    <Grid container spacing={6}>
      <PageHeader
        title={
          <Typography variant='h4'>
            <LinkStyled href='https://mui.com/x/react-data-grid/' target='_blank'>
              Agents Performance
            </LinkStyled>
          </Typography>
        }
      />
      <Grid item xs={12}>
        <TablePerformance />
      </Grid>
    </Grid>
  )
}
AgentPerformance.acl = {
  action: 'read',
  subject: 'agent-management'
}

export default AgentPerformance
