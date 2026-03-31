import { useState, useEffect, useCallback } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const AgentCommissionDashboard = () => {
  const [commissionData, setCommissionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchCommissionData = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/commissions/monthly?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch commission data')
      }
      const data = await response.json()
      setCommissionData(data)
    } catch (error) {
      console.error('Error fetching commission data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchCommissionData()
  }, [fetchCommissionData])

  const getCurrentMonthCommission = () => {
    if (!commissionData?.calculations) return null

    return commissionData.calculations[0] || null
  }

  const getPeriodOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      options.push({ value: period, label })
    }

    return options
  }

  if (loading) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Commission Dashboard' />
            <CardContent>
              <Grid container spacing={4}>
                {[...Array(4)].map((_, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton variant='rectangular' height={100} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const currentCommission = getCurrentMonthCommission()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Agent Commission Dashboard'
            subheader='View your expected commissions and performance metrics'
          />
          <CardContent>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2'>Select Period:</Typography>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {getPeriodOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>

            {commissionData ? (
              <>
                <Grid container spacing={4} sx={{ mb: 6 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 3 }}>
                      <Icon icon='tabler:currency-dollar' fontSize='2rem' color='primary' />
                      <Typography variant='h4' sx={{ mt: 2, fontWeight: 600 }}>
                        TZS {currentCommission?.final_commission?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Expected Commission
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 3 }}>
                      <Icon icon='tabler:exchange' fontSize='2rem' color='success' />
                      <Typography variant='h4' sx={{ mt: 2, fontWeight: 600 }}>
                        {currentCommission?.transaction_count || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Transactions
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 3 }}>
                      <Icon icon='tabler:percentage' fontSize='2rem' color='warning' />
                      <Typography variant='h4' sx={{ mt: 2, fontWeight: 600 }}>
                        {(currentCommission?.commission_rate * 100)?.toFixed(1) || '0'}%
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Commission Rate
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 3 }}>
                      <Icon icon='tabler:chart-bar' fontSize='2rem' color='info' />
                      <Typography variant='h4' sx={{ mt: 2, fontWeight: 600 }}>
                        {currentCommission?.payband?.toFixed(1) || '1.0'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Payband Multiplier
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Card>
                      <CardHeader title='Commission Breakdown' />
                      <CardContent>
                        <TableContainer component={Paper}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Period</TableCell>
                                <TableCell>Agent Type</TableCell>
                                <TableCell align='right'>Transactions</TableCell>
                                <TableCell align='right'>Total Amount</TableCell>
                                <TableCell align='right'>Commission Rate</TableCell>
                                <TableCell align='right'>Final Commission</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {commissionData.calculations?.slice(0, 10).map((calc: any) => (
                                <TableRow key={calc.id}>
                                  <TableCell>{calc.period}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={calc.agent_type}
                                      size='small'
                                      color={
                                        calc.agent_type === 'local_agent'
                                          ? 'primary'
                                          : calc.agent_type === 'super_agent'
                                          ? 'success'
                                          : 'warning'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align='right'>{calc.transaction_count}</TableCell>
                                  <TableCell align='right'>TZS {calc.total_amount?.toLocaleString()}</TableCell>
                                  <TableCell align='right'>{(calc.commission_rate * 100)?.toFixed(1)}%</TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 600 }}>
                                    TZS {calc.final_commission?.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={calc.is_active ? 'Active' : 'Inactive'}
                                      size='small'
                                      color={calc.is_active ? 'success' : 'error'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={4} sx={{ mt: 2 }}>
                  <Grid item xs={12}>
                    <Alert severity='info'>
                      <Typography variant='body2'>
                        <strong>Commission Calculation:</strong> Your commission is calculated based on transaction
                        volume, agent type hierarchy, and performance metrics. Super agents earn additional commissions
                        from agents they serve, while franchise commissions include turnover multipliers and payband
                        adjustments.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity='warning'>
                No commission data available for the selected period. Please ensure transactions have been imported and
                commissions calculated.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

AgentCommissionDashboard.acl = {
  action: 'read',
  subject: 'commissions'
}

export default AgentCommissionDashboard
