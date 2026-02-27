// ** MUI Import
import Grid from '@mui/material/Grid'

// ** Demo Component Imports
import AnalyticsTransactionVisits from 'src/views/dashboards/analytics/AnalyticsTransactionVisit'
import AnalyticsTotalEarning from 'src/views/dashboards/analytics/AnalyticsTotalEarning'
import AnalyticsSourceVisits from 'src/views/dashboards/analytics/AnalyticsSourceVisits'
import AnalyticsEarningReports from 'src/views/dashboards/analytics/AnalyticsEarningReports'
import AnalyticsSupportTracker from 'src/views/dashboards/analytics/AnalyticsSupportTracker'
import AnalyticsSalesByZone from 'src/views/dashboards/analytics/AnalyticsSalesByZone'
import AnalyticsMonthlyCampaignState from 'src/views/dashboards/analytics/AnalyticsMonthlyCampaignState'
import AnalyticsWebsiteAnalyticsSlider from 'src/views/dashboards/analytics/AnalyticsWebsiteAnalyticsSlider'

// ** Custom Component Import
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import CardStatsWithAreaChart from 'src/@core/components/card-statistics/card-stats-with-area-chart'
import AnalyticsTransaction from 'src/views/dashboards/analytics/AnalyticsTransaction'

const AdminDashboard = () => {
  return (
    <ApexChartWrapper>
      <KeenSliderWrapper>
        <Grid container spacing={6}>
          {/* <Grid item xs={12} lg={6}>
            <AnalyticsWebsiteAnalyticsSlider />
          </Grid> */}
          {/* <Grid item xs={12} sm={6} lg={3}>
            <AnalyticsTransactionVisits />
          </Grid> */}
          {/* <Grid item xs={12} sm={6} lg={3}>
            <CardStatsWithAreaChart
              stats='97.5k'
              chartColor='success'
              avatarColor='success'
              title='Revenue Generated'
              avatarIcon='tabler:credit-card'
              chartSeries={[{ data: [6, 35, 25, 61, 32, 84, 70] }]}
            />
          </Grid> */}
          <Grid item xs={12} md={6}>
            <AnalyticsEarningReports />
          </Grid>
          {/* <Grid item xs={12} md={6}>
            <AnalyticsSupportTracker />
          </Grid> */}
          {/* <Grid item xs={12} md={6} lg={4}>
            <AnalyticsSalesByZone />
          </Grid> */}
          <Grid item xs={12} md={6} lg={6}>
            <AnalyticsTotalEarning />
          </Grid>
          {/* <Grid item xs={12} md={6} lg={4}>
            <AnalyticsMonthlyCampaignState />
          </Grid> */}
          {/* <Grid item xs={12} md={6} lg={4}>
            <AnalyticsSourceVisits />
          </Grid> */}
          <Grid item xs={12} lg={12}>
            <AnalyticsTransaction />
          </Grid>
        </Grid>
      </KeenSliderWrapper>
    </ApexChartWrapper>
  )
}

// ** ACL Configuration - Admin can manage everything
AdminDashboard.acl = {
  action: 'manage',
  subject: 'all'
}

export default AdminDashboard
