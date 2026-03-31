// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
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

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface Agent {
  id: string
  name: string
  account_number: string
  type: string
  is_active: boolean
}

interface Template {
  id: number
  title: string
  code: string
  description: string
}

interface CalculationResult {
  agent: Agent
  period: string
  transactionCount: number
  totalAmount: number
  commissionAmount: number
  calculationDetails: any
}

interface BatchCalculationResponse {
  success: boolean
  message: string
  data: {
    period: string
    config: any
    calculations: CalculationResult[]
    summary: {
      totalCalculations: number
      totalCommission: number
      avgCommission: number
      maxCommission: number
      minCommission: number
      totalTransactions: number
      totalAmount: number
    }
  }
}

const CommissionReport = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [period, setPeriod] = useState('2026-01')
  const [calculationType, setCalculationType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [calculationResult, setCalculationResult] = useState<BatchCalculationResponse | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    fetchAgents()
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/commissions/templates')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.length > 0) {
          setTemplates(result.data)
          setActiveTemplate(result.data[0]) // Get first (most recent) template
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/commissions/agents')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgents(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find(t => t.id === templateId)
    setActiveTemplate(template || null)
  }

  const handleCalculateCommissions = async () => {
    if (!period) {
      return
    }

    setLoading(true)
    setCalculationResult(null)

    try {
      const requestBody: any = {
        period,
        calculationType
      }

      if (selectedAgents.length > 0) {
        requestBody.agentIds = selectedAgents
      }

      const response = await fetch('/api/commissions/calculate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result: BatchCalculationResponse = await response.json()
        setCalculationResult(result)

        // Send notifications after successful calculation
        if (result.success && result.data.calculations.length > 0) {
          await sendCommissionNotifications(result.data)
        }
      } else {
        console.error('Calculation failed')
      }
    } catch (error) {
      console.error('Error calculating commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendCommissionNotifications = async (data: any) => {
    try {
      // Send notification to admin/analyst
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'commission_calculation_completed',
          title: `Commission Calculation Completed for ${data.period}`,
          message: `Commission calculations completed for ${
            data.calculations.length
          } agents. Total commission: TZS ${data.summary.totalCommission.toLocaleString()}`,
          recipients: ['admin', 'analyst'],
          data: {
            period: data.period,
            totalAgents: data.calculations.length,
            totalCommission: data.summary.totalCommission
          }
        })
      })

      // Send individual notifications to agents
      for (const calc of data.calculations) {
        if (calc.commissionAmount > 0) {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventType: 'commission_available',
              title: `Commission Available for ${data.period}`,
              message: `Your commission for ${
                data.period
              } is TZS ${calc.commissionAmount.toLocaleString()}. Click to view details.`,
              recipients: [calc.agent.id],
              data: {
                period: data.period,
                commissionAmount: calc.commissionAmount,
                agentId: calc.agent.id
              }
            })
          })
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  const handleScheduleCalculation = async () => {
    try {
      const response = await fetch('/api/commissions/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frequency: 'monthly',
          dayOfMonth: 1, // 1st of every month
          calculationType: 'all'
        })
      })

      if (response.ok) {
        // Show success message
        alert('Commission calculation scheduled for the 1st of every month')
      } else {
        alert('Failed to schedule commission calculation')
      }
    } catch (error) {
      console.error('Error scheduling calculation:', error)
      alert('Error scheduling commission calculation')
    }
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary'
      case 'franchise':
        return 'secondary'
      case 'local_agent':
        return 'default'
      default:
        return 'default'
    }
  }

  // Filter agents for selection (only Super Agents and Franchises)
  const eligibleAgents = agents.filter(agent => agent.type === 'super_agent' || agent.type === 'franchise')

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Commission Report Generator
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Calculate commissions for Super Agents and Franchises
          </Typography>
        </Box>
      </Box>

      {/* Active Template Info */}
      {activeTemplate && (
        <Alert severity='info' sx={{ mb: 6 }}>
          <Typography variant='body2'>
            <strong>Active Template:</strong> {activeTemplate.title} ({activeTemplate.code})
          </Typography>
          <Typography variant='caption' sx={{ mt: 1 }}>
            {activeTemplate.description}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label='Period'
            placeholder='YYYY-MM (e.g., 2026-01)'
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Template</InputLabel>
            <Select
              value={activeTemplate?.id || ''}
              label='Template'
              onChange={e => handleTemplateChange(e.target.value as number)}
            >
              {templates.map(template => (
                <MenuItem key={template.id} value={template.id}>
                  {template.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Calculation Type</InputLabel>
            <Select value={calculationType} label='Calculation Type' onChange={e => setCalculationType(e.target.value)}>
              <MenuItem value='all'>All Types</MenuItem>
              <MenuItem value='super_agent'>Super Agent Only</MenuItem>
              <MenuItem value='franchise'>Franchise Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Selected Agents ({selectedAgents.length})</InputLabel>
            <Select
              multiple
              value={selectedAgents}
              label='Selected Agents'
              onChange={e => setSelectedAgents(e.target.value as string[])}
              renderValue={selected => {
                if (selected.length === 0) return 'All Agents'

                return `${selected.length} Agents Selected`
              }}
            >
              {eligibleAgents.map(agent => (
                <MenuItem key={agent.id} value={agent.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2'>{agent.name}</Typography>
                    <Chip
                      label={agent.type.replace('_', ' ').toUpperCase()}
                      size='small'
                      color={getAgentTypeColor(agent.type) as any}
                      variant='outlined'
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant='contained'
            onClick={handleCalculateCommissions}
            disabled={loading || !period}
            startIcon={<Icon icon='tabler:calculator' />}
          >
            {loading ? 'Calculating...' : 'Calculate Commissions'}
          </Button>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant='outlined'
            onClick={handleScheduleCalculation}
            startIcon={<Icon icon='tabler:calendar-time' />}
          >
            Schedule Monthly
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ mb: 6 }}>
          <LinearProgress />
          <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
            Calculating commissions...
          </Typography>
        </Box>
      )}

      {calculationResult && (
        <>
          {calculationResult.success ? (
            <Alert severity='success' sx={{ mb: 6 }}>
              {calculationResult.message}
            </Alert>
          ) : (
            <Alert severity='error' sx={{ mb: 6 }}>
              {calculationResult.message}
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={6} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary.main' sx={{ mb: 1 }}>
                    {calculationResult.data.summary.totalCalculations}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Calculations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='success.main' sx={{ mb: 1 }}>
                    TZS {calculationResult.data.summary.totalCommission.toLocaleString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Commission
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='info.main' sx={{ mb: 1 }}>
                    {calculationResult.data.summary.totalTransactions}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='warning.main' sx={{ mb: 1 }}>
                    TZS {calculationResult.data.summary.avgCommission.toLocaleString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Average Commission
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Results Table */}
          <Card>
            <CardHeader
              title='Commission Calculation Results'
              action={
                <Typography variant='body2' color='text.secondary'>
                  {calculationResult.data.calculations.length} agents processed
                </Typography>
              }
            />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent Details</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align='right'>Transactions</TableCell>
                      <TableCell align='right'>Total Amount</TableCell>
                      <TableCell align='right'>Commission Rate</TableCell>
                      <TableCell align='right'>Final Commission</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculationResult.data.calculations.map(item => (
                      <TableRow key={item.agent.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant='body2' fontWeight='medium'>
                              {item.agent.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {item.agent.account_number}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.agent.type.replace('_', ' ').toUpperCase()}
                            size='small'
                            color={getAgentTypeColor(item.agent.type) as any}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='right'>{item.transactionCount}</TableCell>
                        <TableCell align='right'>TZS {item.totalAmount.toLocaleString()}</TableCell>
                        <TableCell align='right'>
                          {item.calculationDetails.type === 'super_agent'
                            ? `${(item.calculationDetails.baseRate * 100).toFixed(1)}%`
                            : `${(item.calculationDetails.baseRate * 100).toFixed(2)}%`}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontWeight='medium' color='success.main'>
                            TZS {item.commissionAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {calculationResult.data.calculations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                          <Typography variant='body2' color='text.secondary'>
                            No commission calculations found for the selected criteria
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

CommissionReport.acl = {
  action: 'read',
  subject: 'commissions'
}

export default CommissionReport
