// src/views/pages/commission-report/index.tsx
// ** React Imports
import { useState, useMemo, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { Divider } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

interface SuperAgentKPI {
  totalAgents: number
  activeAgents: number
  activenessScore: number
  valueTransactedScore: number
  uniqueAgentsScore: number
  totalScore: number
  kpiBand: number
  fixedCommission: number
  variableCommission: number
}

interface FranchisePerformance {
  totalCapitalAdvanced?: number
  expectedTurnover?: number
  actualTurnover?: number
  performancePercentage?: number
  paybandLevel?: string
  apportionRate?: number
  clawbackAmount?: number
}

interface CommissionResult {
  agentId: number
  agentName: string
  agentType: string
  accountNumber?: string
  period: string
  totalAmount: number
  transactionCount: number
  eligibleAmount: number
  commissionRate: number
  commissionAmount: number
  payband: number
  finalCommission: number
  clawback?: number
  kpiDetails?: SuperAgentKPI
  performance?: FranchisePerformance
}

const CommissionReport = () => {
  const [period, setPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [agentType, setAgentType] = useState<'SUPER_AGENT' | 'FRANCHISE'>('SUPER_AGENT')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CommissionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [savedStats, setSavedStats] = useState<any>(null)

  // Fetch saved commission stats on load
  useEffect(() => {
    fetchSavedCommissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, agentType])

  const fetchSavedCommissions = async () => {
    try {
      const dbType = agentType === 'SUPER_AGENT' ? 'super_agent' : 'franchise'
      const res = await fetch(`/api/commissions/history?period=${period}&agentType=${dbType}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.summary) {
          setSavedStats(data.summary)
          if (data.data && data.data.length > 0) {
            const mapped: CommissionResult[] = data.data.map((r: any) => ({
              agentId: r.agentId,
              agentName: r.agentName,
              agentType: r.agentType,
              accountNumber: r.accountNumber || '',
              period: r.period,
              totalAmount: r.totalAmount,
              transactionCount: r.transactionCount,
              eligibleAmount: r.eligibleAmount,
              commissionRate: r.commissionRate,
              commissionAmount: r.commissionAmount,
              payband: r.payband,
              finalCommission: r.finalCommission,
              clawback: r.clawback,
              kpiDetails: r.performance
                ? typeof r.performance === 'string'
                  ? JSON.parse(r.performance)
                  : r.performance
                : undefined,
              performance: r.performance
                ? typeof r.performance === 'string'
                  ? JSON.parse(r.performance)
                  : r.performance
                : undefined
            }))
            setResults(mapped)
          }
        }
      }
    } catch (e) {
      console.log('No saved commissions found')
    }
  }

  const filteredResults = useMemo(() => {
    if (!searchTerm) return results
    const lower = searchTerm.toLowerCase()

    return results.filter(
      r => r.agentName.toLowerCase().includes(lower) || (r.accountNumber || '').toLowerCase().includes(lower)
    )
  }, [results, searchTerm])

  const paginatedResults = useMemo(() => {
    const start = (page - 1) * rowsPerPage

    return filteredResults.slice(start, start + rowsPerPage)
  }, [filteredResults, page, rowsPerPage])

  const totalPages = Math.ceil(filteredResults.length / rowsPerPage)

  const summary = useMemo(() => {
    const superAgentResults = results.filter(r => r.agentType === 'super_agent')
    const franchiseResults = results.filter(r => r.agentType === 'franchise')

    return {
      totalAgents: results.length,
      totalCommission: results.reduce((sum, r) => sum + r.finalCommission, 0),
      totalFixedCommission: superAgentResults.reduce((sum, r) => sum + (r.kpiDetails?.fixedCommission || 0), 0),
      totalVariableCommission: superAgentResults.reduce((sum, r) => sum + (r.kpiDetails?.variableCommission || 0), 0),
      totalTransactions: results.reduce((sum, r) => sum + r.transactionCount, 0),
      totalAmount: results.reduce((sum, r) => sum + r.totalAmount, 0),
      avgCommission: results.length > 0 ? results.reduce((sum, r) => sum + r.finalCommission, 0) / results.length : 0,
      totalClawback: franchiseResults.reduce((sum, r) => sum + (r.clawback || 0), 0),
      avgKPIScore:
        superAgentResults.length > 0
          ? superAgentResults.reduce((sum, r) => sum + (r.kpiDetails?.totalScore || 0), 0) / superAgentResults.length
          : 0
    }
  }, [results])

  const calculateCommissions = async () => {
    if (!period) return
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setResults([])

    try {
      const dbType = agentType === 'SUPER_AGENT' ? 'super_agent' : 'franchise'
      const response = await fetch('/api/commissions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, agentType: dbType, background: false })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to calculate commissions')
      }

      const data = await response.json()
      if (data.success && data.results) {
        const mappedResults: CommissionResult[] = data.results.map((r: any) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          agentType: r.agentType,
          accountNumber: r.accountNumber || '',
          period: r.period,
          totalAmount: r.totalAmount,
          transactionCount: r.transactionCount,
          eligibleAmount: r.eligibleAmount,
          commissionRate: r.commissionRate,
          commissionAmount: r.commissionAmount,
          payband: r.payband,
          finalCommission: r.finalCommission,
          clawback: r.clawback,
          kpiDetails: r.kpiDetails,
          performance: r.performance
        }))
        setResults(mappedResults)
        setSavedStats(data.summary)
        setSuccessMsg(`Successfully calculated commissions for ${mappedResults.length} ${dbType.replace('_', ' ')}s`)
      }
    } catch (err) {
      console.error('Calculation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate commissions')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers =
      agentType === 'SUPER_AGENT'
        ? [
            'Agent Name',
            'Account Number',
            'Total Agents',
            'Active Agents',
            'KPI Score',
            'KPI Band',
            'Fixed Commission',
            'Variable Commission',
            'Final Commission'
          ]
        : [
            'Agent Name',
            'Account Number',
            'Capital Advanced',
            'Expected Turnover',
            'Actual Turnover',
            'Performance',
            'Payband',
            'Commission',
            'Clawback'
          ]

    const rows = results.map(r => {
      if (agentType === 'SUPER_AGENT') {
        return [
          r.agentName,
          r.accountNumber,
          r.kpiDetails?.totalAgents || 0,
          r.kpiDetails?.activeAgents || 0,
          `${(r.kpiDetails?.totalScore || 0).toFixed(1)}%`,
          `${r.kpiDetails?.kpiBand || 0}%`,
          r.kpiDetails?.fixedCommission || 0,
          r.kpiDetails?.variableCommission || 0,
          r.finalCommission
        ]
      } else {
        return [
          r.agentName,
          r.accountNumber,
          r.performance?.totalCapitalAdvanced || 0,
          r.performance?.expectedTurnover || 0,
          r.performance?.actualTurnover || 0,
          `${(r.performance?.performancePercentage || 0).toFixed(1)}%`,
          r.performance?.paybandLevel || 'N/A',
          r.finalCommission,
          r.clawback || 0
        ]
      }
    })

    const csvContent = [headers, ...rows].map(row => row.map(f => `"${f}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `commission-report-${agentType.toLowerCase()}-${period}.csv`
    link.click()
  }

  const toggleRowExpansion = (agentId: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(agentId) ? next.delete(agentId) : next.add(agentId)

      return next
    })
  }

  const periodOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      options.push({ value: period, label })
    }

    return options
  }, [])

  const getKpiLabel = (score: number) => {
    if (score >= 91) return { label: 'Excellent', color: 'success' as const }
    if (score >= 81) return { label: 'Very Good', color: 'success' as const }
    if (score >= 71) return { label: 'Good', color: 'primary' as const }
    if (score >= 61) return { label: 'Average', color: 'warning' as const }
    if (score >= 51) return { label: 'Below Average', color: 'warning' as const }

    return { label: 'Poor', color: 'error' as const }
  }

  const getPaybandColor = (payband: string) => {
    switch (payband) {
      case 'Excellent':
        return 'success' as const
      case 'Good':
        return 'primary' as const
      case 'Average':
        return 'warning' as const
      case 'Below Average':
        return 'warning' as const
      case 'Poor':
        return 'error' as const
      default:
        return 'default' as const
    }
  }

  const formatCurrency = (amount: number): string => {
    if (!amount || amount === 0) return '0'
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`

    return amount.toLocaleString()
  }

  const displayStats = savedStats || summary

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Commission Report
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Calculate and view commissions for {agentType === 'SUPER_AGENT' ? 'Super Agents' : 'Franchises'}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size='small'>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={agentType}
                  label='Agent Type'
                  onChange={e => {
                    setAgentType(e.target.value as 'SUPER_AGENT' | 'FRANCHISE')
                    setResults([])
                    setError(null)
                    setSuccessMsg(null)
                    setSavedStats(null)
                  }}
                >
                  <MenuItem value='SUPER_AGENT'>Super Agent</MenuItem>
                  <MenuItem value='FRANCHISE'>Franchise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size='small'>
                <InputLabel>Period</InputLabel>
                <Select value={period} label='Period' onChange={e => setPeriod(e.target.value)}>
                  {periodOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant='contained'
                onClick={calculateCommissions}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Icon icon='tabler:calculator' />}
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant='outlined'
                onClick={fetchSavedCommissions}
                startIcon={<Icon icon='tabler:database' />}
              >
                Load Saved
              </Button>
            </Grid>
            {results.length > 0 && (
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant='outlined'
                  color='success'
                  onClick={handleExportCSV}
                  startIcon={<Icon icon='tabler:download' />}
                >
                  Export CSV
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity='success' sx={{ mb: 4 }}>
          {successMsg}
        </Alert>
      )}

      {/* Stats Cards - Consistent with Admin Dashboard */}
      {(results.length > 0 || savedStats) && (
        <Grid container spacing={6} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CardStatsVertical
              stats={displayStats.totalAgents?.toLocaleString() || '0'}
              avatarColor='primary'
              title='Total Agents'
              subtitle={agentType === 'SUPER_AGENT' ? 'Super Agents' : 'Franchises'}
              avatarIcon='tabler:users'
              chipText=''
              chipColor='default'
              sx={{ '& .MuiChip-root': { display: 'none' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardStatsVertical
              stats={`TZS ${formatCurrency(displayStats.totalCommission || 0)}`}
              avatarColor='success'
              title='Total Commission'
              subtitle='Calculated'
              avatarIcon='tabler:currency-dollar'
              chipText=''
              chipColor='default'
              sx={{ '& .MuiChip-root': { display: 'none' } }}
            />
          </Grid>
          {agentType === 'SUPER_AGENT' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <CardStatsVertical
                  stats={`TZS ${formatCurrency(displayStats.totalFixedCommission || 0)}`}
                  avatarColor='info'
                  title='Fixed Commission'
                  subtitle='30% Portion'
                  avatarIcon='tabler:lock'
                  chipText=''
                  chipColor='default'
                  sx={{ '& .MuiChip-root': { display: 'none' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CardStatsVertical
                  stats={`TZS ${formatCurrency(displayStats.totalVariableCommission || 0)}`}
                  avatarColor='warning'
                  title='Variable Commission'
                  subtitle='70% KPI-Based'
                  avatarIcon='tabler:chart-line'
                  chipText=''
                  chipColor='default'
                  sx={{ '& .MuiChip-root': { display: 'none' } }}
                />
              </Grid>
            </>
          )}
          {agentType === 'FRANCHISE' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <CardStatsVertical
                  stats={displayStats.totalTransactions?.toLocaleString() || '0'}
                  avatarColor='warning'
                  title='Total Transactions'
                  subtitle='Processed'
                  avatarIcon='tabler:receipt'
                  chipText=''
                  chipColor='default'
                  sx={{ '& .MuiChip-root': { display: 'none' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CardStatsVertical
                  stats={`TZS ${formatCurrency(displayStats.totalClawback || 0)}`}
                  avatarColor='error'
                  title='Total Clawback'
                  subtitle='Underperformance'
                  avatarIcon='tabler:arrow-back'
                  chipText=''
                  chipColor='default'
                  sx={{ '& .MuiChip-root': { display: 'none' } }}
                />
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <>
          {/* Search & Rows + Export */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size='small'
                placeholder='Search by name or account number...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='tabler:search' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Rows per page</InputLabel>
                <Select
                  value={rowsPerPage}
                  label='Rows per page'
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Table */}
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 40 }}></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Transactions
                      </TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>
                        Tx Count
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Performance</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Commission
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map(r => {
                      const isExpanded = expandedRows.has(r.agentId)
                      const kpiLabel =
                        agentType === 'SUPER_AGENT' && r.kpiDetails ? getKpiLabel(r.kpiDetails.totalScore) : null

                      return (
                        <>
                          <TableRow key={r.agentId} hover>
                            <TableCell>
                              {(agentType === 'SUPER_AGENT' && r.kpiDetails) ||
                              (agentType === 'FRANCHISE' && r.performance) ? (
                                <IconButton size='small' onClick={() => toggleRowExpansion(r.agentId)}>
                                  <Icon icon={isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'} fontSize={18} />
                                </IconButton>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight='medium'>
                                {r.agentName}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {r.accountNumber}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight='medium'>
                                TZS {r.totalAmount.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Typography variant='body2'>{r.transactionCount}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ mb: 0.5 }}>
                                <Chip
                                  label={
                                    agentType === 'SUPER_AGENT'
                                      ? `${kpiLabel?.label} (${(r.kpiDetails?.totalScore || 0).toFixed(0)}%)`
                                      : `${r.performance?.paybandLevel || 'N/A'} (${(
                                          r.performance?.performancePercentage || 0
                                        ).toFixed(0)}%)`
                                  }
                                  size='small'
                                  color={
                                    agentType === 'SUPER_AGENT'
                                      ? kpiLabel?.color
                                      : getPaybandColor(r.performance?.paybandLevel || '')
                                  }
                                  variant='outlined'
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                              <LinearProgress
                                variant='determinate'
                                value={Math.min(
                                  agentType === 'SUPER_AGENT'
                                    ? r.kpiDetails?.totalScore || 0
                                    : r.performance?.performancePercentage || 0,
                                  100
                                )}
                                sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                              />
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight='bold' color='success.main'>
                                TZS {r.finalCommission.toLocaleString()}
                              </Typography>
                              {r.clawback && r.clawback > 0 && (
                                <Typography variant='caption' color='error.main' display='block'>
                                  Clawback: TZS {r.clawback.toLocaleString()}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                          {/* Add this right after the main TableRow closing tag */}
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ bgcolor: 'action.hover', p: 0 }}>
                                <Box sx={{ p: 3 }}>
                                  {agentType === 'SUPER_AGENT' && r.kpiDetails ? (
                                    <Grid container spacing={3}>
                                      <Grid item xs={12}>
                                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                                          KPI Breakdown
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Total Agents
                                        </Typography>
                                        <Typography variant='body2' fontWeight='bold'>
                                          {r.kpiDetails.totalAgents}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Active Agents
                                        </Typography>
                                        <Typography variant='body2' fontWeight='bold'>
                                          {r.kpiDetails.activeAgents}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          KPI Band
                                        </Typography>
                                        <Chip
                                          label={`${r.kpiDetails.kpiBand}%`}
                                          size='small'
                                          color='primary'
                                          variant='outlined'
                                        />
                                      </Grid>
                                      <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                                          Commission Split
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Fixed (30%)
                                        </Typography>
                                        <Typography variant='body2' fontWeight='bold' color='info.main'>
                                          TZS {r.kpiDetails.fixedCommission?.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Variable (70%)
                                        </Typography>
                                        <Typography variant='body2' fontWeight='bold' color='warning.main'>
                                          TZS {r.kpiDetails.variableCommission?.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  ) : r.performance ? (
                                    <Grid container spacing={3}>
                                      <Grid item xs={12}>
                                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                                          Franchise Performance
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Capital Advanced
                                        </Typography>
                                        <Typography variant='body2' fontWeight='bold'>
                                          TZS {r.performance.totalCapitalAdvanced?.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Expected Turnover
                                        </Typography>
                                        <Typography variant='body2'>
                                          TZS {r.performance.expectedTurnover?.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Actual Turnover
                                        </Typography>
                                        <Typography variant='body2'>
                                          TZS {r.performance.actualTurnover?.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography variant='caption' color='text.secondary'>
                                          Apportion Rate
                                        </Typography>
                                        <Typography variant='body2'>
                                          {(r.performance.apportionRate || 0) * 100}%
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  ) : null}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                          {/* Expandable details - keep existing */}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Showing {paginatedResults.length} of {filteredResults.length}
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color='primary'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

CommissionReport.acl = { action: 'read', subject: 'commissions' }
export default CommissionReport
