// ** MUI Import
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Custom Component Imports
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const AnalystDashboard = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 6 }}>
      <Typography variant='h4' sx={{ mb: 6 }}>
        Analyst Dashboard
      </Typography>

      <Grid container spacing={6}>
        <Grid item xs={6} sm={3}>
          <CardStatsVertical
            stats='78.5%'
            chipText='+2.3%'
            chipColor='default'
            avatarColor='info'
            title='Avg KPI Score'
            subtitle='This Month'
            avatarIcon='tabler:chart-line'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <CardStatsVertical
            stats='92%'
            chipText='+5%'
            avatarColor='success'
            chipColor='default'
            title='Target Achievement'
            subtitle='This Month'
            avatarIcon='tabler:target'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <CardStatsVertical
            stats='45.2M'
            chipText='+12%'
            avatarColor='primary'
            chipColor='default'
            title='Total Commission'
            subtitle='TZS'
            avatarIcon='tabler:currency-dollar'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <CardStatsVertical
            stats='1,234'
            chipText='+8%'
            avatarColor='warning'
            chipColor='default'
            title='Transactions'
            subtitle='This Month'
            avatarIcon='tabler:transaction-dollar'
          />
        </Grid>

        {/* Commission Overview */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Commission Overview' />
            <CardContent>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Monitor and analyze commission data across all Super Agents and Franchises.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Track performance metrics, KPI achievements, and commission calculations in real-time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Recent Activity' />
            <CardContent>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • Commission report generated
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • KPI analysis completed
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • Performance review submitted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Quick Actions' />
            <CardContent>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • Generate Commission Report
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • Analyze Performance Data
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                • Review KPI Metrics
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnalystDashboard
