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
  Chip,
  Button,
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
interface CommissionSummary {
  totalDetected: number
  activeCount: number
  totalValue: number
  totalAgentCommissions: number
  eligibleSACommission: number
  fixedCommission: number
  variableCommission: number
  finalCommission: number
  kpiScore: number
  kpiBand: number
  qualifyingAgents: QualifyingAgent[]
}

interface QualifyingAgent {
  account_number: string
  name: string
  total_amount: number
  transaction_count: number
}

interface TransactionAgent {
  id: number | null
  name: string
  account_number: string
  transaction_count: number
  total_amount: number
}

const SuperAgentDashboard = () => {
  const { agentData } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    expectedCommission: 0,
    kpiScore: 0
  })
  const [agents, setAgents] = useState<TransactionAgent[]>([])
  const [commissionData, setCommissionData] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 25

  const calculateCommission = useCallback(async (transactionAgents: TransactionAgent[], token: string) => {
    if (!transactionAgents.length) {
      setCommissionData(null)

      return
    }

    try {
      const configRes = await fetch('/api/commissions/config', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!configRes.ok) throw new Error('Failed to fetch config')

      const configs = await configRes.json()
      const activeConfig = configs.find((c: any) => c.type === 'SUPER_AGENT' && c.status === 'active')

      if (!activeConfig) {
        setCommissionData(null)

        return
      }

      const minThreshold: number = activeConfig.minTransactionAmount || 100000
      const qualifyingAgents = transactionAgents.filter(
        (a: TransactionAgent) => a.id !== null && (a.total_amount || 0) >= minThreshold
      )

      if (!qualifyingAgents.length) {
        setCommissionData({
          totalDetected: transactionAgents.length,
          activeCount: 0,
          totalValue: 0,
          totalAgentCommissions: 0,
          eligibleSACommission: 0,
          fixedCommission: 0,
          variableCommission: 0,
          finalCommission: 0,
          kpiScore: 0,
          kpiBand: 0,
          qualifyingAgents: []
        })

        return
      }

      const totalValue = qualifyingAgents.reduce((sum: number, a: TransactionAgent) => sum + (a.total_amount || 0), 0)
      const baseRate: number = activeConfig.commissionRate || 0.0005
      const totalAgentCommissions = totalValue * baseRate
      const saRate: number = activeConfig.superAgentCommissionRate || 0.2
      const eligibleSACommission = totalAgentCommissions * saRate

      const kpiWeights: any = activeConfig.kpiWeights
        ? typeof activeConfig.kpiWeights === 'string'
          ? JSON.parse(activeConfig.kpiWeights)
          : activeConfig.kpiWeights
        : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

      const kpiBands: any[] = activeConfig.paybandRates
        ? typeof activeConfig.paybandRates === 'string'
          ? JSON.parse(activeConfig.paybandRates)
          : activeConfig.paybandRates
        : [
            { min: 0, max: 50, rate: 0 },
            { min: 51, max: 60, rate: 20 },
            { min: 61, max: 70, rate: 40 },
            { min: 71, max: 80, rate: 60 },
            { min: 81, max: 90, rate: 80 },
            { min: 91, max: 100, rate: 100 }
          ]

      const totalDetected = transactionAgents.filter((a: TransactionAgent) => a.id !== null).length
      const activeCount = qualifyingAgents.length
      const uniqueCount = new Set(qualifyingAgents.map((a: TransactionAgent) => a.account_number)).size

      const activenessScore = totalDetected > 0 ? (activeCount / totalDetected) * 100 : 0
      const monthlyTarget = 100000000
      const valueScore = Math.min((totalValue / monthlyTarget) * 100, 100)
      const uniqueScore = totalDetected > 0 ? (uniqueCount / totalDetected) * 100 : 0

      const totalKPIScore =
        (activenessScore * kpiWeights.activeness +
          valueScore * kpiWeights.valueTransacted +
          uniqueScore * kpiWeights.uniqueAgents) /
        100

      const applicableBand = kpiBands.find((b: any) => totalKPIScore >= b.min && totalKPIScore <= b.max) || { rate: 0 }

      const fixedRate: number = activeConfig.superAgentFixedRate || 0.3
      const variableRate: number = activeConfig.superAgentVariableRate || 0.7
      const fixedCommission = eligibleSACommission * fixedRate
      const variableCommission = eligibleSACommission * variableRate * (applicableBand.rate / 100)
      const finalCommission = fixedCommission + variableCommission

      setCommissionData({
        totalDetected,
        activeCount,
        totalValue,
        totalAgentCommissions,
        eligibleSACommission,
        fixedCommission,
        variableCommission,
        finalCommission,
        kpiScore: totalKPIScore,
        kpiBand: applicableBand.rate,
        qualifyingAgents: qualifyingAgents.map((a: TransactionAgent) => ({
          account_number: a.account_number,
          name: a.name,
          total_amount: a.total_amount || 0,
          transaction_count: a.transaction_count || 0
        }))
      })

      setStats(prev => ({
        ...prev,
        expectedCommission: finalCommission,
        kpiScore: Math.round(totalKPIScore)
      }))
    } catch (error) {
      console.error('Error calculating commission:', error)
    }
  }, [])

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
          const transactionAgents: TransactionAgent[] = data.data || []
          setAgents(transactionAgents)

          const totalTransactions = transactionAgents.reduce(
            (sum: number, a: TransactionAgent) => sum + (a.transaction_count || 0),
            0
          )
          const totalAmount = transactionAgents.reduce(
            (sum: number, a: TransactionAgent) => sum + (a.total_amount || 0),
            0
          )

          setStats(prev => ({
            ...prev,
            totalAgents: transactionAgents.length,
            totalTransactions,
            totalAmount
          }))

          await calculateCommission(transactionAgents, token)
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

  const getPerformanceLabel = (kpiScore: number): { label: string; color: 'success' | 'warning' | 'error' } => {
    if (kpiScore >= 91) return { label: 'Excellent', color: 'success' }
    if (kpiScore >= 81) return { label: 'Very Good', color: 'success' }
    if (kpiScore >= 71) return { label: 'Good', color: 'success' }
    if (kpiScore >= 61) return { label: 'Average', color: 'warning' }
    if (kpiScore >= 51) return { label: 'Below Average', color: 'warning' }

    return { label: 'Poor', color: 'error' }
  }

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

  const filteredAgents = agents.filter((agent: TransactionAgent) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()

    return agent.name?.toLowerCase().includes(search) || agent.account_number?.toLowerCase().includes(search)
  })

  const paginatedAgents = filteredAgents.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const perfLabel = commissionData ? getPerformanceLabel(commissionData.kpiScore) : null

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant='h4' gutterBottom>
              {agentData?.name || 'Super Agent'} Dashboard
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Monitor your agents and track commission performance
            </Typography>
          </Box>
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
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={stats.totalAgents.toLocaleString()}
          title='Agents Served'
          subtitle='Under Your Network'
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
          subtitle='Transaction Value'
          avatarIcon='tabler:currency-dollar'
          avatarColor='warning'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatsVertical
          stats={`TZS ${formatCurrency(stats.expectedCommission)}`}
          title='Expected Commission'
          subtitle='This Month'
          avatarIcon='tabler:chart-line'
          avatarColor='info'
          chipText=''
          sx={{ '& .MuiChip-root': { display: 'none' } }}
        />
      </Grid>

      {commissionData && (
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                KPI Performance
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  width: '100%',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <CircularProgress
                  variant='determinate'
                  value={Math.min(commissionData.kpiScore, 100)}
                  size={120}
                  thickness={8}
                  color={
                    commissionData.kpiScore >= 80 ? 'success' : commissionData.kpiScore >= 60 ? 'warning' : 'error'
                  }
                />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Typography variant='h4'>{Math.round(commissionData.kpiScore)}%</Typography>
                </Box>
              </Box>
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                {perfLabel?.label || 'N/A'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption'>Fixed (30%)</Typography>
                  <Typography variant='caption' fontWeight='medium'>
                    TZS {formatCurrency(commissionData.fixedCommission)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption'>Variable (70%)</Typography>
                  <Typography variant='caption' fontWeight='medium'>
                    TZS {formatCurrency(commissionData.variableCommission)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='caption' fontWeight='bold'>
                    Total
                  </Typography>
                  <Typography variant='caption' fontWeight='bold' color='success.main'>
                    TZS {formatCurrency(commissionData.finalCommission)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12} md={commissionData ? 8 : 12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Agent Performance
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip label={`Total: ${agents.length}`} color='primary' variant='outlined' size='small' />
              {commissionData && (
                <>
                  <Chip
                    label={`Qualifying: ${commissionData.activeCount}`}
                    color='success'
                    variant='outlined'
                    size='small'
                  />
                  <Chip
                    label={`Below Threshold: ${commissionData.totalDetected - commissionData.activeCount}`}
                    color='error'
                    variant='outlined'
                    size='small'
                  />
                </>
              )}
            </Box>

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

            {paginatedAgents.length > 0 ? (
              <>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          Transactions
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          Amount
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600 }}>
                          Status
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600 }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedAgents.map((agent: TransactionAgent, index: number) => {
                        const isQualifying = commissionData?.qualifyingAgents?.some(
                          (qa: QualifyingAgent) => qa.account_number === agent.account_number
                        )

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
                                onClick={() => router.push(`/agents/view/${agent.id}`)}
                              >
                                {agent.name}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {agent.account_number}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2'>{agent.transaction_count?.toLocaleString() || 0}</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight='medium'>
                                TZS {formatCurrency(agent.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={isQualifying ? 'Qualified' : 'Below Threshold'}
                                size='small'
                                color={isQualifying ? 'success' : 'error'}
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={() => router.push(`/agents/view/${agent.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {Math.ceil(filteredAgents.length / rowsPerPage) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(filteredAgents.length / rowsPerPage)}
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
                  No agents found
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

SuperAgentDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default SuperAgentDashboard
