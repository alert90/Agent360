// ** React Imports
import { useState, useEffect, useCallback } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** MUI Imports
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Chip,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination
} from '@mui/material'

// ** Custom Components
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Types
interface CommissionItem {
  agentId: number
  agentName: string
  accountNumber: string
  capitalAdvanced: number
  expectedTurnover: number
  actualTurnover: number
  transactionCount: number
  performancePct: number
  payband: string
  apportionRate: number
  baseCommission: number
  finalCommission: number
  clawback: number
}

interface TransactionAgent {
  id: number | null
  name: string
  account_number: string
  transaction_count: number
  total_amount: number
}

const FranchiseDashboard = () => {
  const { agentData } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    performanceRatio: 0
  })
  const [commissionData, setCommissionData] = useState<CommissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [commissionLoading, setCommissionLoading] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 25

  const calculateCommission = useCallback(
    async (agents: TransactionAgent[], token: string) => {
      if (!agents.length || !agentData?.id) {
        setCommissionData([])

        return
      }

      setCommissionLoading(true)
      try {
        const configRes = await fetch('/api/commissions/config', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!configRes.ok) throw new Error('Failed to fetch config')

        const configs = await configRes.json()
        const activeConfig = configs.find((c: any) => c.type === 'FRANCHISE' && c.status === 'active')

        if (!activeConfig) {
          setCommissionData([])
          setCommissionLoading(false)

          return
        }

        const [year, month] = selectedPeriod.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

        const multiplier: number = activeConfig.franchiseMultiplier || 4.5
        const baseRate: number = activeConfig.franchiseBaseRate || 0.0005

        const paybands: any[] = activeConfig.paybandRates
          ? typeof activeConfig.paybandRates === 'string'
            ? JSON.parse(activeConfig.paybandRates)
            : activeConfig.paybandRates
          : [
              { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
              { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
              { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
              { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
              { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
            ]

        const agentsToCalc = agents.filter((a: TransactionAgent) => a.id !== null)
        const results: CommissionItem[] = []
        let totalComm = 0

        for (const agent of agentsToCalc) {
          const capitalAdvanced = agent.total_amount || 0
          let actualTurnover = capitalAdvanced

          try {
            const txRes = await fetch(`/api/agents/${agent.id}/transactions?page=1&limit=10000`, {
              headers: { Authorization: `Bearer ${token}` }
            })

            if (txRes.ok) {
              const txData = await txRes.json()
              if (txData.success && txData.data) {
                actualTurnover = txData.data
                  .filter((t: any) => {
                    const d = new Date(t.timestamp || t.createdAt || t.created_at)

                    return d >= startDate && d <= endDate && !isNaN(d.getTime())
                  })
                  .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)
              }
            }
          } catch {
            // Use capital advanced as fallback
          }

          const expectedTurnover = capitalAdvanced * multiplier
          const performancePct = expectedTurnover > 0 ? Math.min((actualTurnover / expectedTurnover) * 100, 100) : 0

          const pr = Math.floor(performancePct)
          const payband =
            paybands.find((b: any) => pr >= b.min && (b.max === Infinity || b.max === null || pr <= b.max)) ||
            paybands[paybands.length - 1]

          const baseCommission = actualTurnover * baseRate
          const finalCommission = baseCommission * (payband.apportionRate || 0)
          const clawback = baseCommission * ((payband.clawbackPercentage || 0) / 100)

          totalComm += finalCommission

          results.push({
            agentId: agent.id as number,
            agentName: agent.name,
            accountNumber: agent.account_number,
            capitalAdvanced,
            expectedTurnover,
            actualTurnover,
            transactionCount: agent.transaction_count || 0,
            performancePct,
            payband: payband.name || 'N/A',
            apportionRate: payband.apportionRate || 0,
            baseCommission,
            finalCommission,
            clawback
          })
        }

        results.sort((a, b) => b.finalCommission - a.finalCommission)
        setCommissionData(results)

        const avgPerformance =
          results.length > 0
            ? results.reduce((sum: number, r: CommissionItem) => sum + r.performancePct, 0) / results.length
            : 0

        setStats(prev => ({
          ...prev,
          totalCommission: totalComm,
          performanceRatio: Math.round(avgPerformance)
        }))
      } catch (error) {
        console.error('Error calculating commission:', error)
      } finally {
        setCommissionLoading(false)
      }
    },
    [agentData?.id, selectedPeriod]
  )

  const fetchDashboardData = useCallback(async () => {
    if (!agentData?.id) return

    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const periodParam = `?period=${selectedPeriod}`
      const response = await fetch(`/api/agents/${agentData.id}/transaction-agents${periodParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const agents: TransactionAgent[] = data.data || []
          const totalTransactions = agents.reduce(
            (sum: number, a: TransactionAgent) => sum + (a.transaction_count || 0),
            0
          )
          const totalAmount = agents.reduce((sum: number, a: TransactionAgent) => sum + (a.total_amount || 0), 0)

          setStats(prev => ({
            ...prev,
            totalAgents: agents.length,
            totalTransactions,
            totalAmount
          }))

          await calculateCommission(agents, token)
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [agentData?.id, selectedPeriod, calculateCommission])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrency = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0'

    return amount.toLocaleString()
  }

  const getPerformanceLabel = (
    payband: string
  ): { label: string; color: 'success' | 'primary' | 'warning' | 'error' | 'default' } => {
    switch (payband) {
      case 'Excellent':
        return { label: 'Excellent', color: 'success' }
      case 'Good':
        return { label: 'Good', color: 'primary' }
      case 'Average':
        return { label: 'Average', color: 'warning' }
      case 'Below Average':
        return { label: 'Below Average', color: 'warning' }
      case 'Poor':
        return { label: 'Poor', color: 'error' }
      default:
        return { label: payband || 'N/A', color: 'default' }
    }
  }

  const filteredCommissions = commissionData.filter((c: CommissionItem) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()

    return c.agentName?.toLowerCase().includes(search) || c.accountNumber?.toLowerCase().includes(search)
  })

  const paginatedCommissions = filteredCommissions.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const getPeriodOptions = () => {
    const options: { value: string; label: string }[] = []
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' gutterBottom>
          {agentData?.name || 'Franchise'} Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Track your network performance and commission earnings
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalAgents.toLocaleString()}
          title='Total Agents'
          subtitle='In Your Network'
          avatarIcon='tabler:users'
          avatarColor='primary'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalTransactions.toLocaleString()}
          title='Transactions'
          subtitle='Total Volume'
          avatarIcon='tabler:receipt'
          avatarColor='success'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalAmount)}`}
          title='Total Amount'
          subtitle='Turnover'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.totalCommission)}`}
          title='Commission Earned'
          subtitle='This Month'
          avatarIcon='tabler:chart-line'
          avatarColor='info'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Performance Overview
            </Typography>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Performance Ratio
                </Typography>
                <Typography variant='h3' color='success.main'>
                  {stats.performanceRatio}%
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Required Target (4.5x)
                </Typography>
                <Typography variant='h5'>
                  TZS{' '}
                  {formatCurrency(
                    commissionData.reduce((sum: number, c: CommissionItem) => sum + (c.expectedTurnover || 0), 0)
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Current Turnover
                </Typography>
                <Typography variant='h5'>
                  TZS{' '}
                  {formatCurrency(
                    commissionData.reduce((sum: number, c: CommissionItem) => sum + (c.actualTurnover || 0), 0)
                  )}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Agent Performance & Commission</Typography>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <Select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                  {getPeriodOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {commissionLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1 }}>Calculating commissions...</Typography>
              </Box>
            ) : commissionData.length > 0 ? (
              <>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Search by agent name or account number...'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:search' />
                      </InputAdornment>
                    )
                  }}
                />

                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          Capital Advanced
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          Actual Turnover
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600 }}>
                          Performance
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          Commission
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCommissions.map((calc: CommissionItem, index: number) => {
                        const perfLabel = getPerformanceLabel(calc.payband)

                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography
                                variant='body2'
                                fontWeight='medium'
                                sx={{
                                  cursor: 'pointer',
                                  color: 'primary.main',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => router.push(`/agents/view/${calc.agentId}`)}
                              >
                                {calc.agentName}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {calc.accountNumber}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2'>TZS {formatCurrency(calc.capitalAdvanced)}</Typography>
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Expected: TZS {formatCurrency(calc.expectedTurnover)}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight='medium'>
                                TZS {formatCurrency(calc.actualTurnover)}
                              </Typography>
                            </TableCell>
                            <TableCell align='center' sx={{ minWidth: 150 }}>
                              <Chip
                                label={`${perfLabel.label} (${Math.round(calc.performancePct)}%)`}
                                size='small'
                                color={perfLabel.color}
                                variant='outlined'
                                sx={{ mb: 0.5 }}
                              />
                              <LinearProgress
                                variant='determinate'
                                value={Math.min(calc.performancePct, 100)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight='bold' color='success.main'>
                                TZS {formatCurrency(calc.finalCommission)}
                              </Typography>
                              {calc.clawback > 0 && (
                                <Typography variant='caption' color='error.main' display='block'>
                                  Clawback: TZS {formatCurrency(calc.clawback)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {Math.ceil(filteredCommissions.length / rowsPerPage) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(filteredCommissions.length / rowsPerPage)}
                      page={page}
                      onChange={(_, p) => setPage(p)}
                      color='primary'
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Icon icon='tabler:users' fontSize='2rem' color='text.secondary' />
                <Typography color='text.secondary' sx={{ mt: 1 }}>
                  No agent performance data available for this period
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

FranchiseDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default FranchiseDashboard
