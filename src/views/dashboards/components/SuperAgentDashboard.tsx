// ** MUI Import
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Demo Component Imports
import EcommerceProfit from 'src/views/dashboards/ecommerce/EcommerceProfit'
import EcommerceOrders from 'src/views/dashboards/ecommerce/EcommerceOrders'
import EcommerceStatistics from 'src/views/dashboards/ecommerce/EcommerceStatistics'
import EcommerceTransactions from 'src/views/dashboards/ecommerce/EcommerceTransactions'
import EcommerceRevenueReport from 'src/views/dashboards/ecommerce/EcommerceRevenueReport'
import EcommerceEarningReports from 'src/views/dashboards/ecommerce/EcommerceEarningReports'
import EcommerceGeneratedLeads from 'src/views/dashboards/ecommerce/EcommerceGeneratedLeads'
import EcommercePopularProducts from 'src/views/dashboards/ecommerce/EcommercePopularProducts'
import EcommerceCongratulationsJohn from 'src/views/dashboards/ecommerce/EcommerceCongratulationsJohn'

// ** Custom Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const SuperAgentDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} md={4}>
          <EcommerceCongratulationsJohn />
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={6}>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='8.45M'
                chipText='+25%'
                chipColor='default'
                avatarColor='primary'
                title='Total Eligible'
                subtitle='Commission'
                avatarIcon='tabler:currency-dollar'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='2.54M'
                chipText='+15%'
                avatarColor='success'
                chipColor='default'
                title='Fixed Commission'
                subtitle='30%'
                avatarIcon='tabler:shield-check'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='5.92M'
                chipText='+18%'
                avatarColor='info'
                chipColor='default'
                title='Variable Commission'
                subtitle='70%'
                avatarIcon='tabler:chart-line'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='85%'
                chipText='+5%'
                avatarColor='warning'
                chipColor='default'
                title='KPI Score'
                subtitle='Performance'
                avatarIcon='tabler:target'
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Agent Network Overview */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={6}>
            <Grid item xs={6} md={3} lg={6}>
              <CardStatsVertical
                stats='45'
                title='Total Agents'
                avatarColor='info'
                avatarIcon='tabler:users'
                subtitle='This Month'
                chipText='+8'
                chipColor='default'
              />
            </Grid>
            <Grid item xs={6} md={3} lg={6}>
              <CardStatsVertical
                stats='38'
                title='Active Agents'
                avatarColor='success'
                avatarIcon='tabler:user-check'
                subtitle='This Month'
                chipText='+5'
                chipColor='default'
              />
            </Grid>
            <Grid item xs={12} md={6} lg={12}>
              <EcommerceGeneratedLeads />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} lg={8}>
          <EcommerceRevenueReport />
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Performance Summary' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                      Real-time Performance Tracking
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Monitor your agents' performance and commission trends in real-time.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Agents Served
                      </Typography>
                      <Typography variant='h6'>45</Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Deposits
                      </Typography>
                      <Typography variant='h6'>12.5M TZS</Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Last Commission
                      </Typography>
                      <Typography variant='h6'>2.1M TZS</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                      KPI Performance
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Current performance against targets and commission potential.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Current KPI
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        85%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Target
                      </Typography>
                      <Typography variant='h6'>90%</Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Commission Trend
                      </Typography>
                      <Typography variant='h6' color='primary.main'>
                        +18%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <EcommerceEarningReports />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <EcommercePopularProducts />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <EcommerceOrders />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <EcommerceTransactions />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default SuperAgentDashboard
