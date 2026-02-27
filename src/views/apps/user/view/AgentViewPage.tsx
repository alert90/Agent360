// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Types
import { InvoiceType } from 'src/types/apps/invoiceTypes'

// ** Demo Components Imports
import AgentViewLeft from 'src/views/apps/user/view/AgentViewLeft'
import AgentViewRight from 'src/views/apps/user/view/AgentViewRight'

type Props = {
  tab: string
  invoiceData: InvoiceType[]
}

const AgentViewPage = ({ tab, invoiceData }: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <AgentViewLeft />
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <AgentViewRight tab={tab} invoiceData={invoiceData} />
      </Grid>
    </Grid>
  )
}

export default AgentViewPage
