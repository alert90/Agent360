// ** MUI Import
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

// ** Demo Component Imports
import EcommerceProfit from 'src/views/dashboards/ecommerce/EcommerceProfit'
import EcommerceOrders from 'src/views/dashboards/ecommerce/EcommerceOrders'
import EcommerceStatistics from 'src/views/dashboards/ecommerce/EcommerceStatistics'
import EcommerceInvoiceTable from 'src/views/dashboards/ecommerce/EcommerceInvoiceTable'
import EcommerceTransactions from 'src/views/dashboards/ecommerce/EcommerceTransactions'
import EcommerceRevenueReport from 'src/views/dashboards/ecommerce/EcommerceRevenueReport'
import EcommerceEarningReports from 'src/views/dashboards/ecommerce/EcommerceEarningReports'
import EcommerceGeneratedLeads from 'src/views/dashboards/ecommerce/EcommerceGeneratedLeads'
import EcommercePopularProducts from 'src/views/dashboards/ecommerce/EcommercePopularProducts'
import EcommerceCongratulationsJohn from 'src/views/dashboards/ecommerce/EcommerceCongratulationsJohn'

// ** Custom Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const FranchiseDashboard = () => {
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
                stats='1.25M'
                chipText='+8%'
                chipColor='default'
                avatarColor='primary'
                title='Total Deposit'
                subtitle='TZS'
                avatarIcon='tabler:currency-dollar'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='5.63M'
                chipText='+12%'
                avatarColor='success'
                chipColor='default'
                title='Transaction Value'
                subtitle='TZS'
                avatarIcon='tabler:transaction-dollar'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='94%'
                chipText='+8%'
                avatarColor='info'
                chipColor='default'
                title='Performance Ratio'
                subtitle='vs Target'
                avatarIcon='tabler:chart-bar'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <CardStatsVertical
                stats='625'
                chipText='+15%'
                avatarColor='warning'
                chipColor='default'
                title='Gross Commission'
                subtitle='TZS'
                avatarIcon='tabler:coin'
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Local Agents Overview */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={6}>
            <Grid item xs={6} md={3} lg={6}>
              <CardStatsVertical
                stats='18'
                title='Total Agents'
                avatarColor='info'
                avatarIcon='tabler:users'
                subtitle='Network'
                chipText='+3'
                chipColor='default'
              />
            </Grid>
            <Grid item xs={6} md={3} lg={6}>
              <CardStatsVertical
                stats='15'
                title='Active Agents'
                avatarColor='success'
                avatarIcon='tabler:user-check'
                subtitle='This Month'
                chipText='+2'
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

        {/* Business Performance */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Business Performance Overview' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                      Channel Management
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Monitor your local agents and their performance metrics.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Served Agents
                      </Typography>
                      <Typography variant='h6'>18</Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Transaction Volume
                      </Typography>
                      <Typography variant='h6'>5.63M TZS</Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Last Commission Paid
                      </Typography>
                      <Typography variant='h6'>625K TZS</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                      Profitability & Growth
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Track your business growth and profitability indicators.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Profitability
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        High
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Monthly Growth
                      </Typography>
                      <Typography variant='h6' color='primary.main'>
                        +12%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Customer Satisfaction
                      </Typography>
                      <Typography variant='h6'>94%</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Commission Calculation Details */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Commission Calculation Details' />
            <CardContent>
              <Typography variant='body1' gutterBottom>
                <strong>Formula:</strong> 0.05% × Total Deposit × Payband Apportion
              </Typography>
              <Typography variant='body1' gutterBottom>
                <strong>Calculation:</strong> 0.0005 × 1,250,000 TZS × 1.0 = <strong>625 TZS</strong>
              </Typography>
              <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
                Performance Ratio: 94% | Payband Apportion: 1.0
              </Typography>
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
        <Grid item xs={12} lg={8}>
          <EcommerceInvoiceTable />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default FranchiseDashboard
