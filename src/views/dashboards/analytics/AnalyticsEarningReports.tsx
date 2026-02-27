// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid, { GridProps } from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'
import LinearProgress from '@mui/material/LinearProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

// ** Third Party Imports
import { ApexOptions } from 'apexcharts'
import axios from 'axios'

// ** Type Import
import { ThemeColor } from 'src/@core/layouts/types'

// ** Custom Components Imports
import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

interface TransactionTypeData {
  count: number
  amount: number
  average: number
}

interface EarningPeriodData {
  period: string
  deposit: TransactionTypeData
  withdrawal: TransactionTypeData
  transfer: TransactionTypeData
  payment: TransactionTypeData
}

interface EarningReportsData {
  daily: EarningPeriodData[]
  weekly: EarningPeriodData[]
  monthly: EarningPeriodData[]
  todayActive: number
}

const StyledGrid = styled(Grid)<GridProps>(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    paddingTop: '0 !important'
  }
}))

const AnalyticsEarningReports = () => {
  // ** State
  const [data, setData] = useState<EarningReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // ** Hook
  const theme = useTheme()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/analytics')
        setData(response.data.earningReports)
      } catch (error) {
        console.error('Error fetching earning reports:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'daily' | 'weekly' | 'monthly') => {
    setActiveTab(newValue)
  }

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} B`
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} K`

    return `${amount.toLocaleString()}`
  }

  // Get current period data
  const currentPeriodData = data?.[activeTab] || []
  const latestPeriod = currentPeriodData[currentPeriodData.length - 1]

  // Create chart data from the latest period
  const chartData = latestPeriod
    ? [
        latestPeriod.deposit.count,
        latestPeriod.withdrawal.count,
        latestPeriod.transfer.count,
        latestPeriod.payment.count
      ]
    : [0, 0, 0, 0]

  // Create transaction type summary
  const transactionTypes = [
    {
      title: 'Deposit',
      stats: formatAmount(latestPeriod?.deposit.amount || 0),
      progress: latestPeriod ? Math.min((latestPeriod.deposit.count / Math.max(...chartData)) * 100, 100) : 0,
      avatarIcon: 'tabler:plus',
      avatarColor: 'success' as ThemeColor,
      progressColor: 'success' as ThemeColor
    },
    {
      title: 'Withdrawal',
      stats: formatAmount(latestPeriod?.withdrawal.amount || 0),
      progress: latestPeriod ? Math.min((latestPeriod.withdrawal.count / Math.max(...chartData)) * 100, 100) : 0,
      avatarIcon: 'tabler:minus',
      avatarColor: 'error' as ThemeColor,
      progressColor: 'error' as ThemeColor
    },
    {
      title: 'Transfer',
      stats: formatAmount(latestPeriod?.transfer.amount || 0),
      progress: latestPeriod ? Math.min((latestPeriod.transfer.count / Math.max(...chartData)) * 100, 100) : 0,
      avatarIcon: 'tabler:arrow-right',
      avatarColor: 'primary' as ThemeColor,
      progressColor: 'primary' as ThemeColor
    },
    {
      title: 'Payment',
      stats: formatAmount(latestPeriod?.payment.amount || 0),
      progress: latestPeriod ? Math.min((latestPeriod.payment.count / Math.max(...chartData)) * 100, 100) : 0,
      avatarIcon: 'tabler:credit-card',
      avatarColor: 'warning' as ThemeColor,
      progressColor: 'warning' as ThemeColor
    }
  ]

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        distributed: true,
        columnWidth: '42%',
        endingShape: 'rounded',
        startingShape: 'rounded'
      }
    },
    legend: { show: false },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    colors: [
      hexToRGBA(theme.palette.success.main, 1),
      hexToRGBA(theme.palette.error.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.warning.main, 1)
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    grid: {
      show: false,
      padding: {
        top: -28,
        left: -9,
        right: -10,
        bottom: -12
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['Deposit', 'Withdrawal', 'Transfer', 'Payment'],
      labels: {
        style: {
          colors: theme.palette.text.disabled,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: { show: false }
  }

  const totalAmount = latestPeriod
    ? latestPeriod.deposit.amount +
      latestPeriod.withdrawal.amount +
      latestPeriod.transfer.amount +
      latestPeriod.payment.amount
    : 0

  return (
    <Card>
      <CardHeader
        sx={{ pb: 0 }}
        title='Transaction Reports'
        subheader='Deposit, Withdrawal, Transfer & Payment Analytics'
        action={
          <OptionsMenu
            options={['Last Week', 'Last Month', 'Last Year']}
            iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
          />
        }
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='earning reports tabs'>
            <Tab value='daily' label='Daily' />
            <Tab value='weekly' label='Weekly' />
            <Tab value='monthly' label='Monthly' />
          </Tabs>
        </Box>

        <Grid container spacing={6}>
          <StyledGrid
            item
            sm={5}
            xs={12}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end' }}
          >
            <Box sx={{ mb: 3, rowGap: 1, columnGap: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant='h1'>{formatAmount(totalAmount)}</Typography>
              <CustomChip
                rounded
                size='small'
                skin='light'
                color='success'
                label={`+${data?.todayActive || 0} Today`}
              />
            </Box>
            <Typography variant='body2'>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} transaction overview by type
            </Typography>
          </StyledGrid>
          <StyledGrid item xs={12} sm={7}>
            <ReactApexcharts type='bar' height={163} series={[{ data: chartData }]} options={options} />
          </StyledGrid>
        </Grid>

        <Box sx={{ mt: 6, borderRadius: 1, p: theme.spacing(4, 5), border: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={6}>
            {transactionTypes.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar
                    skin='light'
                    variant='rounded'
                    color={item.avatarColor}
                    sx={{ mr: 2, width: 26, height: 26 }}
                  >
                    <Icon fontSize='1.125rem' icon={item.avatarIcon} />
                  </CustomAvatar>
                  <Typography variant='h6'>{item.title}</Typography>
                </Box>
                <Typography variant='h4' sx={{ mb: 2.5 }}>
                  {item.stats}
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={item.progress}
                  color={item.progressColor}
                  sx={{ height: 4 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AnalyticsEarningReports
