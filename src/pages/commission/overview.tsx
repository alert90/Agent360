// src/views/pages/commission-overview/index.tsx
import { useState, useEffect, useMemo } from 'react'

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
import Pagination from '@mui/material/Pagination'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

const CommissionOverview = () => {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedType, setSelectedType] = useState('all')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [calculating, setCalculating] = useState(false)

  // Replace handleCalculate and fetchCommissions in CommissionOverview with this:

  const fetchCommissions = async (period?: string, type?: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      const p = period || selectedPeriod
      const t = type || selectedType
      if (p) params.append('period', p)
      if (t !== 'all') params.append('agentType', t)

      const response = await fetch(`/api/commissions/history?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const result = await response.json()
        console.log('History response:', result)
        if (result.success && result.data) {
          setCommissions(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    setCalculating(true)
    setCommissions([])
    try {
      const typesToCalc: string[] = []
      if (selectedType === 'all' || selectedType === 'super_agent') typesToCalc.push('super_agent')
      if (selectedType === 'all' || selectedType === 'franchise') typesToCalc.push('franchise')

      const allResults: any[] = []

      for (const dbType of typesToCalc) {
        const res = await fetch('/api/commissions/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: selectedPeriod, agentType: dbType, background: false })
        })
        const data = await res.json()
        console.log(`Calculated ${dbType}:`, data)

        // Use results directly from the calculate API (same as CommissionReport does)
        if (data.success && data.results) {
          const mapped = data.results.map((r: any) => ({
            id: r.agentId,
            agentId: r.agentId,
            agentName: r.agentName,
            agentType: r.agentType,
            accountNumber: r.accountNumber || '',
            period: r.period,
            totalAmount: r.totalAmount,
            transactionCount: r.transactionCount,
            commissionRate: r.commissionRate,
            finalCommission: r.finalCommission,
            clawback: r.clawback
          }))
          allResults.push(...mapped)
        }
      }

      setCommissions(allResults)
      console.log(`Total results: ${allResults.length}`)
    } catch (e) {
      console.error('Calculation failed:', e)
    } finally {
      setCalculating(false)
    }
  }

  // Replace the useEffect for fetching:
  useEffect(() => {
    const loadData = async () => {
      await fetchCommissions(selectedPeriod, selectedType)
    }
    loadData()
  }, [selectedPeriod, selectedType])

  const periodOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({ value: period, label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) })
    }

    return options
  }, [])

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const name = c.agentName || c.agent_name || ''
      const id = c.agentId || c.agent_id || ''
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) || id.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [commissions, searchTerm])

  const paginatedCommissions = useMemo(() => {
    const start = (page - 1) * rowsPerPage

    return filteredCommissions.slice(start, start + rowsPerPage)
  }, [filteredCommissions, page, rowsPerPage])

  const totalPages = Math.ceil(filteredCommissions.length / rowsPerPage)

  const summary = useMemo(() => {
    const total = filteredCommissions.length
    const totalAmount = filteredCommissions.reduce((s, c) => s + (c.totalAmount || c.total_amount || 0), 0)
    const totalTx = filteredCommissions.reduce((s, c) => s + (c.transactionCount || c.transaction_count || 0), 0)
    const avgComm =
      total > 0
        ? filteredCommissions.reduce((s, c) => s + (c.finalCommission || c.final_commission || 0), 0) / total
        : 0

    return { totalAgents: total, totalAmount, totalTransactions: totalTx, avgCommission: avgComm }
  }, [filteredCommissions])

  const formatCurrency = (amount: number) => {
    if (!amount) return '0'
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`

    return amount.toLocaleString()
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary' as const
      case 'franchise':
        return 'secondary' as const
      default:
        return 'default' as const
    }
  }

  const handleExportCSV = () => {
    const headers = [
      'Agent Name',
      'Type',
      'Period',
      'Transactions',
      'Total Amount',
      'Commission Rate',
      'Final Commission'
    ]
    const rows = filteredCommissions.map(c => [
      c.agentName || c.agent_name || 'Unknown',
      (c.agentType || c.agent_type || 'unknown').replace('_', ' ').toUpperCase(),
      c.period,
      c.transactionCount || c.transaction_count || 0,
      (c.totalAmount || c.total_amount || 0).toLocaleString(),
      `${((c.commissionRate || c.commission_rate || 0) * 100).toFixed(2)}%`,
      (c.finalCommission || c.final_commission || 0).toLocaleString()
    ])
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `commission-overview-${selectedPeriod}.csv`
    a.click()
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Commission Overview
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            View and manage commission calculations
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Icon icon='tabler:download' />}
          onClick={handleExportCSV}
          disabled={filteredCommissions.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={summary.totalAgents.toLocaleString()}
            avatarColor='primary'
            title='Total Commissions'
            subtitle='Records'
            avatarIcon='tabler:receipt'
            chipText=''
            chipColor='default'
            sx={{ '& .MuiChip-root': { display: 'none' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={`TZS ${formatCurrency(summary.totalAmount)}`}
            avatarColor='success'
            title='Total Amount'
            subtitle='Volume'
            avatarIcon='tabler:currency-dollar'
            chipText=''
            chipColor='default'
            sx={{ '& .MuiChip-root': { display: 'none' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={summary.totalTransactions.toLocaleString()}
            avatarColor='warning'
            title='Transactions'
            subtitle='Processed'
            avatarIcon='tabler:exchange'
            chipText=''
            chipColor='default'
            sx={{ '& .MuiChip-root': { display: 'none' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatsVertical
            stats={`TZS ${formatCurrency(summary.avgCommission)}`}
            avatarColor='info'
            title='Avg Commission'
            subtitle='Per Agent'
            avatarIcon='tabler:chart-bar'
            chipText=''
            chipColor='default'
            sx={{ '& .MuiChip-root': { display: 'none' } }}
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size='small'>
                <InputLabel>Agent Type</InputLabel>
                <Select value={selectedType} label='Agent Type' onChange={e => setSelectedType(e.target.value)}>
                  <MenuItem value='all'>All Types</MenuItem>
                  <MenuItem value='super_agent'>Super Agents</MenuItem>
                  <MenuItem value='franchise'>Franchises</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size='small'>
                <InputLabel>Period</InputLabel>
                <Select value={selectedPeriod} label='Period' onChange={e => setSelectedPeriod(e.target.value)}>
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
                onClick={handleCalculate}
                disabled={calculating}
                startIcon={calculating ? <CircularProgress size={20} /> : <Icon icon='tabler:calculator' />}
              >
                {calculating ? 'Running...' : 'Calculate'}
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size='small'
                placeholder='Search by name or agent ID...'
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size='small'>
                <InputLabel>Rows</InputLabel>
                <Select
                  value={rowsPerPage}
                  label='Rows'
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Transactions
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Total Amount
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Commission Rate
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        Final Commission
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCommissions.map(c => (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight='medium'>
                            {c.agentName || c.agent_name || 'Unknown'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {c.accountNumber || c.agentId || c.agent_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(c.agentType || c.agent_type || 'unknown').replace('_', ' ').toUpperCase()}
                            size='small'
                            color={getAgentTypeColor(c.agentType || c.agent_type)}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>{c.period}</TableCell>
                        <TableCell align='right'>{c.transactionCount || c.transaction_count || 0}</TableCell>
                        <TableCell align='right'>
                          TZS {(c.totalAmount || c.total_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align='right'>
                          {((c.commissionRate || c.commission_rate || 0) * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontWeight='bold' color='success.main'>
                            TZS {(c.finalCommission || c.final_commission || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedCommissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align='center' sx={{ py: 6 }}>
                          No commission records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Showing {paginatedCommissions.length} of {filteredCommissions.length}
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
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default CommissionOverview
