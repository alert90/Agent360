// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// ** Third Party Imports
import axios from 'axios'

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface SuperAgentData {
  summary: {
    agentsServed: number
    totalTransactions: number
    totalAmount: number
    expectedCommission: number
    liableCommission: number
  }
}

const CrmSessions = () => {
  // ** State
  const [data, setData] = useState<SuperAgentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/super-agent')
        setData(response.data)
      } catch (error) {
        console.error('Error fetching super agent data:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `TZS ${(amount / 1000000000).toFixed(1)} B`
    if (amount >= 1000000) return `TZS ${(amount / 1000000).toFixed(1)} M`
    if (amount >= 1000) return `TZS ${(amount / 1000).toFixed(1)} K`

    return `TZS ${amount.toLocaleString()}`
  }

  // Metrics to display
  const metrics = [
    {
      title: 'Agents Served',
      value: data?.summary.agentsServed || 0,
      subtitle: 'Local agents under you',
      icon: 'tabler:user-check',
      color: 'primary'
    },
    {
      title: 'Total Transactions',
      value: data?.summary.totalTransactions || 0,
      subtitle: 'Transactions completed',
      icon: 'tabler:exchange',
      color: 'success'
    },
    {
      title: 'Total Amount',
      value: formatAmount(data?.summary.totalAmount || 0),
      subtitle: 'Transaction volume',
      icon: 'tabler:currency-dollar',
      color: 'info'
    },
    {
      title: 'Expected Commission',
      value: formatAmount(data?.summary.expectedCommission || 0),
      subtitle: 'Commission eligible',
      icon: 'tabler:coin',
      color: 'warning'
    }
  ]

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' sx={{ mb: 1 }}>
          Super Agent Overview
        </Typography>
        <Typography variant='body2' sx={{ color: 'text.disabled', mb: 4 }}>
          Your performance metrics
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {metrics.map((metric, index) => (
              <Grid item xs={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CustomAvatar
                    skin='light'
                    color={metric.color as any}
                    variant='rounded'
                    sx={{ mr: 2, width: 40, height: 40 }}
                  >
                    <Icon icon={metric.icon} />
                  </CustomAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' sx={{ lineHeight: 1.2 }}>
                      {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                      {metric.title}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Commission Summary */}
        {!loading && data && (
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderTopColor: 'divider' }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Commission Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Liable Commission
                </Typography>
                <Typography variant='h5' sx={{ color: 'success.main' }}>
                  {formatAmount(data.summary.liableCommission)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Expected vs Liable
                </Typography>
                <Typography variant='body2' sx={{ color: 'warning.main' }}>
                  {(
                    ((data.summary.expectedCommission - data.summary.liableCommission) /
                      data.summary.expectedCommission) *
                    100
                  ).toFixed(1)}
                  % difference
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CrmSessions
