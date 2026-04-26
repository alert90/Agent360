import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Pagination from '@mui/material/Pagination'
import Snackbar from '@mui/material/Snackbar'
import { DataGrid } from '@mui/x-data-grid'
import { CircularProgress } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// Add these interfaces at the top of the file, after the imports
interface Agent {
  id: number
  name: string
  accountNumber: string
  type: string
  isActive: number
  parentAgentId?: number | null
  email?: string | null
  phone?: string | null
  contact?: string | null
  address?: string
  createdAt: Date | string
}

interface Transaction {
  id: string
  transactionId?: string
  agent_id: string
  agent_name?: string
  transaction_date?: string
  timestamp?: string
  amount: number
  type?: string
  transaction_type?: string
  customerName?: string
  reference_number?: string
  reference?: string
  status: string
  description?: string
  narration?: string
  agent_account_number?: string
  commission_amount?: number
}

interface AssociatedAgent {
  id: number
  name: string
  account_number: string
  type: string
  is_active: boolean
  assigned_at: string
  total_transactions: number
  total_amount: number
}

interface TransactionAgent {
  id: number | null
  name: string
  account_number: string
  type: string
  is_active: boolean
  parent_agent_id: number | null
  transaction_count: number
  total_amount: number
  last_transaction_date: string | null
  transaction_types: string
  is_detected: boolean
  is_assigned: boolean
}

interface TransactionAgentsMeta {
  threshold: number
  agent_type: string
  detected_type: string | null
  is_auto_detected: boolean
  total_detected: number
  assigned_count: number
  unassigned_count: number
}

const AgentView = () => {
  const router = useRouter()
  const { id, tab } = router.query

  const [agent, setAgent] = useState<Agent | null>(null)
  const [associatedAgents, setAssociatedAgents] = useState<AssociatedAgent[]>([])
  const [transactionAgents, setTransactionAgents] = useState<TransactionAgent[]>([])
  const [transactionAgentsMeta, setTransactionAgentsMeta] = useState<TransactionAgentsMeta | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionAgentFilter, setTransactionAgentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState((tab as string) || 'transactions')
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [transactionPage, setTransactionPage] = useState(0)
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(25)
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null)
  const [commissionData, setCommissionData] = useState<any[]>([])
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionSearchTerm, setCommissionSearchTerm] = useState('')
  const [commissionPage, setCommissionPage] = useState(1)
  const [commissionRowsPerPage, setCommissionRowsPerPage] = useState(25)

  const [selectedCommissionPeriod, setSelectedCommissionPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Agent search state for manually assigned agents
  const [agentSearchTerm, setAgentSearchTerm] = useState('')

  // Transaction agent search and pagination state
  const [transactionAgentSearchTerm, setTransactionAgentSearchTerm] = useState('')
  const [transactionAgentPage, setTransactionAgentPage] = useState(1)
  const [transactionAgentRowsPerPage, setTransactionAgentRowsPerPage] = useState(25)

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    type: 'assign' | 'unassign' | 'reassign'
    targetAgentId: number | null
    targetAccountNumber: string
    currentParentId: number | null
    message: string
  } | null>(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Helper to check if agent should show Agents tab
  const shouldShowAgentsTab = (): boolean => {
    if (!agent) return false
    if (agent.type === 'super_agent' || agent.type === 'franchise') return true
    if (transactionAgentsMeta && transactionAgentsMeta.total_detected > 0) return true

    return false
  }

  // Filter and paginate transaction agents
  const filteredTransactionAgents = useMemo(() => {
    let filtered = transactionAgents

    // Apply search filter
    if (transactionAgentSearchTerm) {
      const searchLower = transactionAgentSearchTerm.toLowerCase()
      filtered = filtered.filter(
        agent =>
          agent.name.toLowerCase().includes(searchLower) || agent.account_number.toLowerCase().includes(searchLower)
      )
    }

    // Apply assignment filter
    if (transactionAgentFilter !== 'all') {
      filtered = filtered.filter(agent =>
        transactionAgentFilter === 'assigned' ? agent.is_assigned : !agent.is_assigned
      )
    }

    return filtered
  }, [transactionAgents, transactionAgentSearchTerm, transactionAgentFilter])

  // Paginated transaction agents
  const paginatedTransactionAgents = useMemo(() => {
    const start = (transactionAgentPage - 1) * transactionAgentRowsPerPage
    const end = start + transactionAgentRowsPerPage

    return filteredTransactionAgents.slice(start, end)
  }, [filteredTransactionAgents, transactionAgentPage, transactionAgentRowsPerPage])

  const totalTransactionAgentsPages = Math.ceil(filteredTransactionAgents.length / transactionAgentRowsPerPage)

  // Fetch functions (keep your existing ones)
  const fetchAgentDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        console.error('No authentication token found')
        setLoading(false)

        return
      }

      const response = await fetch(`/api/agents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgent(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching agent details:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchAssociatedAgents = useCallback(async () => {
    if (!agent) {
      setAssociatedAgents([])

      return
    }

    const isSuperOrFranchise =
      agent.type === 'super_agent' || agent.type === 'franchise' || transactionAgentsMeta?.is_auto_detected

    if (!isSuperOrFranchise) {
      setAssociatedAgents([])

      return
    }

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('accessToken')

      if (!token) {
        console.error('No authentication token found')

        return
      }

      const response = await fetch(`/api/agents/${id}/associated`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAssociatedAgents(result.data)
        }
      } else {
        console.error('Failed to fetch associated agents:', response.status)
      }
    } catch (error) {
      console.error('Error fetching associated agents:', error)
    }
  }, [agent, id, transactionAgentsMeta?.is_auto_detected])

  // Filter transactions based on search and type
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Apply search filter (by transaction ID, customer name, or narration)
    if (transactionSearchTerm) {
      const searchLower = transactionSearchTerm.toLowerCase()
      filtered = filtered.filter(
        t =>
          (t.transactionId && t.transactionId.toLowerCase().includes(searchLower)) ||
          (t.customerName && t.customerName.toLowerCase().includes(searchLower)) ||
          (t.narration && t.narration.toLowerCase().includes(searchLower)) ||
          (t.agent_name && t.agent_name.toLowerCase().includes(searchLower))
      )
    }

    // Apply type filter
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => (t.type || t.transaction_type) === transactionTypeFilter)
    }

    return filtered
  }, [transactions, transactionSearchTerm, transactionTypeFilter])

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = transactionPage * transactionRowsPerPage
    const end = start + transactionRowsPerPage

    return filteredTransactions.slice(start, end)
  }, [filteredTransactions, transactionPage, transactionRowsPerPage])

  const fetchTransactionAgents = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${id}/transaction-agents`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactionAgents(result.data)
          setTransactionAgentsMeta(result.meta)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction agents:', error)
    }
  }, [id])

  const calculateCommissions = useCallback(async () => {
    const agentsToCalculate = transactionAgents.filter(a => a.id !== null)

    if (!agent || agentsToCalculate.length === 0) {
      console.log('No agents to calculate commissions for')
      setCommissionData([])

      return
    }

    setCommissionLoading(true)
    try {
      const response = await fetch('/api/commissions/config')
      if (!response.ok) throw new Error('Failed to fetch commission config')

      const configs = await response.json()
      const activeConfig = configs.find(
        (c: any) => c.type === (agent.type === 'super_agent' ? 'SUPER_AGENT' : 'FRANCHISE') && c.status === 'active'
      )

      if (!activeConfig) {
        console.log('No active commission config found')
        setCommissionData([])
        setCommissionLoading(false)

        return
      }

      console.log(`Using config: ${activeConfig.title} for ${agentsToCalculate.length} agents`)

      const [year, month] = selectedCommissionPeriod.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

      // Process in batches of 50 for better performance
      const BATCH_SIZE = 50
      const allResults: any[] = []

      for (let i = 0; i < agentsToCalculate.length; i += BATCH_SIZE) {
        const batch = agentsToCalculate.slice(i, i + BATCH_SIZE)

        const batchResults = await Promise.all(
          batch.map(async txAgent => {
            const totalAgentTransactions = txAgent.total_amount || 0
            const transactionCount = txAgent.transaction_count || 0

            if (agent.type === 'super_agent') {
              // Super Agent Commission Calculation
              const kpiWeights = activeConfig.kpiWeights
                ? typeof activeConfig.kpiWeights === 'string'
                  ? JSON.parse(activeConfig.kpiWeights)
                  : activeConfig.kpiWeights
                : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 }

              const kpiBands = activeConfig.paybandRates
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

              const minThreshold = activeConfig.minTransactionAmount || 100000
              const minThresholdMet = totalAgentTransactions >= minThreshold
              const activenessScore = minThresholdMet ? 100 : 0
              const valueScore = Math.min((totalAgentTransactions / 100000000) * 100, 100)
              const uniqueScore = transactionCount > 0 ? 100 : 0

              const totalKPIScore =
                (activenessScore * kpiWeights.activeness) / 100 +
                (valueScore * kpiWeights.valueTransacted) / 100 +
                (uniqueScore * kpiWeights.uniqueAgents) / 100

              const applicableBand = kpiBands.find((b: any) => totalKPIScore >= b.min && totalKPIScore <= b.max) || {
                rate: 0
              }

              const baseCommission = totalAgentTransactions * (activeConfig.commissionRate || 0.05)
              const saRate = activeConfig.superAgentCommissionRate || 0.2
              const eligibleSACommission = baseCommission * saRate
              const fixedPortion = eligibleSACommission * (activeConfig.superAgentFixedRate || 0.3)
              const variablePortion =
                eligibleSACommission * (activeConfig.superAgentVariableRate || 0.7) * (applicableBand.rate / 100)
              const finalCommission = fixedPortion + variablePortion

              return {
                agentId: txAgent.id,
                agentName: txAgent.name,
                accountNumber: txAgent.account_number,
                totalTransactions: totalAgentTransactions,
                transactionCount,
                isEligible: minThresholdMet,
                kpiScore: totalKPIScore,
                kpiBand: applicableBand.rate,
                baseCommission,
                fixedPortion,
                variablePortion,
                finalCommission,
                performance: `${totalKPIScore.toFixed(1)}%`
              }
            } else {
              // Franchise Commission Calculation
              const multiplier = activeConfig.franchiseMultiplier || 4.5
              const baseRate = activeConfig.franchiseBaseRate || 0.0005
              const capitalAdvanced = totalAgentTransactions

              let actualTurnover = totalAgentTransactions
              try {
                const agentTxResponse = await fetch(`/api/agents/${txAgent.id}/transactions?page=1&limit=10000`)
                if (agentTxResponse.ok) {
                  const agentTxData = await agentTxResponse.json()
                  if (agentTxData.success && agentTxData.data) {
                    actualTurnover = agentTxData.data
                      .filter((t: any) => {
                        const txDate = new Date(t.timestamp || t.createdAt)

                        return txDate >= startDate && txDate <= endDate
                      })
                      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                  }
                }
              } catch (e) {
                console.log(`Could not fetch transactions for agent ${txAgent.id}, using detected amount`)
              }

              const expectedTurnover = capitalAdvanced * multiplier
              const performancePct = expectedTurnover > 0 ? Math.min((actualTurnover / expectedTurnover) * 100, 100) : 0

              const paybands = activeConfig.paybandRates
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

              const applicablePayband =
                paybands.find((b: any) => {
                  const perfRounded = Math.floor(performancePct)
                  if (b.max === Infinity || b.max === null) {
                    return perfRounded >= b.min
                  }

                  return perfRounded >= b.min && perfRounded <= b.max
                }) || paybands[paybands.length - 1]

              const baseCommission = actualTurnover * baseRate
              const finalCommission = baseCommission * applicablePayband.apportionRate
              const clawback = baseCommission * (applicablePayband.clawbackPercentage / 100)

              return {
                agentId: txAgent.id,
                agentName: txAgent.name,
                accountNumber: txAgent.account_number,
                totalTransactions: actualTurnover,
                transactionCount,
                capitalAdvanced,
                expectedTurnover,
                actualTurnover,
                performancePct,
                payband: applicablePayband.name,
                apportionRate: applicablePayband.apportionRate,
                baseCommission,
                finalCommission,
                clawback,
                performance: `${performancePct.toFixed(1)}%`
              }
            }
          })
        )

        allResults.push(...batchResults)

        // Update progress incrementally for large datasets
        if (agentsToCalculate.length > 100) {
          setCommissionData([...allResults])
        }
      }

      // Filter out any null/undefined results
      const validResults = allResults.filter(r => r !== null && r !== undefined)
      setCommissionData(validResults)
      console.log(`Calculated commissions for ${validResults.length} agents`)
    } catch (error) {
      console.error('Error calculating commissions:', error)
      setCommissionData([])
    } finally {
      setCommissionLoading(false)
    }
  }, [agent, transactionAgents, selectedCommissionPeriod])

  const filteredCommissionData = useMemo(() => {
    let filtered = commissionData

    if (commissionSearchTerm) {
      const searchLower = commissionSearchTerm.toLowerCase()
      filtered = filtered.filter(
        c => c.agentName?.toLowerCase().includes(searchLower) || c.accountNumber?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [commissionData, commissionSearchTerm])

  const paginatedCommissionData = useMemo(() => {
    const start = (commissionPage - 1) * commissionRowsPerPage
    const end = start + commissionRowsPerPage

    return filteredCommissionData.slice(start, end)
  }, [filteredCommissionData, commissionPage, commissionRowsPerPage])

  const totalCommissionPages = Math.ceil(filteredCommissionData.length / commissionRowsPerPage)

  const getSuperAgentPerformanceLabel = (kpiScore: number) => {
    if (kpiScore >= 91) return { label: 'Excellent', color: 'success' as const }
    if (kpiScore >= 81) return { label: 'Very Good', color: 'success' as const }
    if (kpiScore >= 71) return { label: 'Good', color: 'primary' as const }
    if (kpiScore >= 61) return { label: 'Average', color: 'warning' as const }
    if (kpiScore >= 51) return { label: 'Below Average', color: 'warning' as const }

    return { label: 'Poor', color: 'error' as const }
  }

  const getFranchisePerformanceLabel = (payband: string) => {
    switch (payband) {
      case 'Excellent':
        return { label: 'Excellent', color: 'success' as const }
      case 'Good':
        return { label: 'Good', color: 'primary' as const }
      case 'Average':
        return { label: 'Average', color: 'warning' as const }
      case 'Below Average':
        return { label: 'Below Average', color: 'warning' as const }
      case 'Poor':
        return { label: 'Poor', color: 'error' as const }
      default:
        return { label: payband || 'N/A', color: 'default' as const }
    }
  }

  // Trigger calculation when tab changes to commission
  useEffect(() => {
    if (currentTab === 'commission' && agent && transactionAgents.length > 0) {
      calculateCommissions()
    }
  }, [currentTab, agent, transactionAgents, calculateCommissions])

  // Add helper to get period options
  const getCommissionPeriodOptions = () => {
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

  // Handle assign with styled dialog
  const openAssignConfirmDialog = (targetAgentId: number, accountNumber: string, currentParentId: number | null) => {
    if (currentParentId && currentParentId !== agent?.id) {
      setConfirmDialogConfig({
        type: 'reassign',
        targetAgentId,
        targetAccountNumber: accountNumber,
        currentParentId,
        message: `This agent is already assigned to another ${
          agent?.type === 'super_agent' ? 'super agent' : 'franchise'
        }. Do you want to unassign from the current parent and assign to this one?`
      })
    } else if (currentParentId === agent?.id) {
      setSnackbar({ open: true, message: 'This agent is already assigned to you.', severity: 'info' })

      return
    } else {
      setConfirmDialogConfig({
        type: 'assign',
        targetAgentId,
        targetAccountNumber: accountNumber,
        currentParentId,
        message: `Are you sure you want to assign ${accountNumber} to ${agent?.name}?`
      })
    }
    setConfirmDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!confirmDialogConfig || !confirmDialogConfig.targetAgentId) return

    setConfirmDialogOpen(false)
    setAssigningAgent(confirmDialogConfig.targetAccountNumber)

    try {
      const response = await fetch(`/api/agents/${id}/assign-transaction-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_agent_id: confirmDialogConfig.targetAgentId,
          target_account_number: confirmDialogConfig.targetAccountNumber
        })
      })

      const result = await response.json()

      if (result.success) {
        setSnackbar({ open: true, message: result.message, severity: 'success' })

        // Refresh data
        await fetchTransactionAgents()
        await fetchAssociatedAgents()
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to assign agent', severity: 'error' })
      }
    } catch (error) {
      console.error('Error assigning agent:', error)
      setSnackbar({ open: true, message: 'Failed to assign agent', severity: 'error' })
    } finally {
      setAssigningAgent(null)
    }
  }

  const handleUnassignAgent = async (targetAgentId: number, accountNumber: string) => {
    setConfirmDialogConfig({
      type: 'unassign',
      targetAgentId,
      targetAccountNumber: accountNumber,
      currentParentId: null,
      message: `Are you sure you want to unassign ${accountNumber} from ${agent?.name}?`
    })
    setConfirmDialogOpen(true)
  }

  const handleConfirmUnassign = async () => {
    if (!confirmDialogConfig || !confirmDialogConfig.targetAgentId) return

    setConfirmDialogOpen(false)
    setAssigningAgent(confirmDialogConfig.targetAccountNumber)

    try {
      const response = await fetch(
        `/api/agents/${id}/assign-transaction-agent?target_agent_id=${confirmDialogConfig.targetAgentId}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        setSnackbar({ open: true, message: result.message, severity: 'success' })
        await fetchTransactionAgents()
        await fetchAssociatedAgents()
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to unassign agent', severity: 'error' })
      }
    } catch (error) {
      console.error('Error unassigning agent:', error)
      setSnackbar({ open: true, message: 'Failed to unassign agent', severity: 'error' })
    } finally {
      setAssigningAgent(null)
    }
  }

  const fetchTransactions = useCallback(async () => {
    if (!agent) {
      setTransactions([])

      return
    }

    try {
      const response = await fetch(`/api/agents/${id}/transactions?page=1&limit=10000`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }, [agent, id])

  // Effects
  useEffect(() => {
    if (id) {
      fetchAgentDetails()
      fetchTransactionAgents()
    }
  }, [id, fetchAgentDetails, fetchTransactionAgents])

  useEffect(() => {
    if (agent) {
      if (currentTab === 'agents') {
        fetchAssociatedAgents()
      } else if (currentTab === 'transactions') {
        fetchTransactions()
      } else if (currentTab === 'account') {
        fetchAssociatedAgents()
        fetchTransactionAgents()
      } else if (currentTab === 'commission') {
        fetchAssociatedAgents()
        fetchTransactionAgents()
        fetchTransactions()
      }
    }
  }, [agent, currentTab, fetchAssociatedAgents, fetchTransactions, fetchTransactionAgents])

  const handleTabChange = (event: any, newValue: string) => {
    setCurrentTab(newValue)
    router.push(`/agents/view/${id}?tab=${newValue}`, undefined, { shallow: true })
  }

  const handleTransactionClick = (transaction: Transaction) => {
    const transactionId = transaction.transactionId || transaction.id
    router.push(`/transactions/${transactionId}`)
  }

  const handleAgentSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentSearchTerm(event.target.value)
  }

  const getFilteredAgents = () => {
    if (!agentSearchTerm) return associatedAgents

    return associatedAgents.filter(
      agent =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.account_number.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        String(agent.id).toLowerCase().includes(agentSearchTerm.toLowerCase())
    )
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary'
      case 'franchise':
        return 'info'
      case 'local_agent':
        return 'default'
      default:
        return 'default'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'success'
      case 'withdrawal':
        return 'error'
      case 'transfer':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading agent details...
        </Typography>
      </Box>
    )
  }

  if (!agent) {
    return (
      <Box sx={{ p: 6 }}>
        <Alert severity='error'>Agent not found</Alert>
      </Box>
    )
  }

  const getAgentTypeDisplayName = (type: string | null | undefined): string => {
    if (!type) return 'UNKNOWN'

    return type.replace('_', ' ').toUpperCase()
  }

  const getAgentTypeDescription = (type: string | null | undefined): string => {
    if (type === 'franchise') {
      return 'Franchise agents typically transact with both agents (01J7 accounts) and customers. They usually have more deposits than transfers.'
    }
    if (type === 'super_agent') {
      return 'Super agents primarily transact with other agents (01J7 accounts) and rarely with direct customers. They usually have more transfers than deposits.'
    }

    return ''
  }

  return (
    <Box sx={{ p: 6 }}>
      {/* Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Button
          variant='outlined'
          startIcon={<Icon icon='tabler:arrow-left' />}
          onClick={() => router.push('/agents/list')}
        >
          Back to Agents
        </Button>
      </Box>

      {/* Agent Header */}
      <Card sx={{ mb: 6 }}>
        <CardHeader
          title={agent.name}
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={agent.type.replace('_', ' ').toUpperCase()}
                size='small'
                color={getAgentTypeColor(agent.type) as any}
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                Account: {agent.accountNumber}
              </Typography>
              <Chip
                label={agent.isActive ? 'Active' : 'Inactive'}
                size='small'
                color={agent.isActive ? 'success' : 'error'}
                variant='outlined'
              />
            </Box>
          }
          action={
            <Button
              variant='outlined'
              startIcon={<Icon icon='tabler:edit' />}
              onClick={() => router.push(`/agents/edit/${id}`)}
            >
              Edit Agent
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Contact Information
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {agent.email || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Phone:</strong> {agent.phone || agent.contact || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Address:</strong> {agent.address || 'Not provided'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Account Details
              </Typography>
              <Typography variant='body2'>
                <strong>Agent ID:</strong> {agent.id}
              </Typography>
              <Typography variant='body2'>
                <strong>Account Number:</strong> {agent.accountNumber || 'Not provided'}
              </Typography>
              <Typography variant='body2'>
                <strong>Created:</strong>{' '}
                {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Not provided'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <TabContext value={currentTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label='Agent details tabs'>
            <Tab label='Transactions' value='transactions' />
            <Tab label='Account' value='account' />
            {shouldShowAgentsTab() && <Tab label='Agents' value='agents' />}
            {shouldShowAgentsTab() && <Tab label='Commissions' value='commission' />}
          </TabList>
        </Box>

        {/* Account Tab */}
        <TabPanel value='account'>
          {/* Account details content - keep as is */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='Account Information' />
            <CardContent>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Detailed account information for {agent.name}
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' sx={{ mb: 2 }}>
                    Profile Information
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Full Name:</strong> {agent.name}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Agent Type:</strong> {agent.type.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Status:</strong> {agent.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Member Since:</strong>{' '}
                    {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' sx={{ mb: 2 }}>
                    Financial Summary
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Total Transactions:</strong> {transactions.length}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Total Volume:</strong> TZS{' '}
                    {transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Associated Agents:</strong>{' '}
                    {transactionAgentsMeta?.assigned_count || associatedAgents.length} of{' '}
                    {transactionAgentsMeta?.total_detected || associatedAgents.length} assigned to {agent.name}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Associated Agents Section */}
          {/* Associated Agents Section on Account Tab - With Progress Bars */}
          <Card>
            <CardHeader
              title='Associated Agents'
              subheader={`${associatedAgents.length} agents assigned to ${agent.name}`}
            />
            <CardContent>
              {associatedAgents.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent Name</TableCell>
                        <TableCell>Account Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align='right'>Transactions</TableCell>
                        <TableCell align='right'>Total Amount</TableCell>
                        <TableCell>Performance</TableCell>
                        <TableCell>Assigned Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {associatedAgents.map(assocAgent => {
                        // Calculate performance percentage (based on transaction count relative to highest)
                        const maxTransactions = Math.max(...associatedAgents.map(a => a.total_transactions), 1)
                        const performancePercent = (assocAgent.total_transactions / maxTransactions) * 100

                        return (
                          <TableRow key={assocAgent.id} hover>
                            <TableCell>
                              <Typography variant='body2' fontWeight='medium'>
                                {assocAgent.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{assocAgent.account_number}</TableCell>
                            <TableCell>
                              <Chip
                                label={assocAgent.type.replace('_', ' ').toUpperCase()}
                                size='small'
                                color='default'
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell align='right'>{assocAgent.total_transactions.toLocaleString()}</TableCell>
                            <TableCell align='right'>TZS {assocAgent.total_amount.toLocaleString()}</TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LinearProgress
                                  variant='determinate'
                                  value={Math.min(performancePercent, 100)}
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                  color={
                                    performancePercent >= 80
                                      ? 'success'
                                      : performancePercent >= 50
                                      ? 'warning'
                                      : 'error'
                                  }
                                />
                                <Typography variant='caption' sx={{ minWidth: 45 }}>
                                  {Math.round(performancePercent)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{new Date(assocAgent.assigned_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No associated agents found for {agent.name}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Agents Tab - Updated with search and pagination */}
        {shouldShowAgentsTab() && (
          <TabPanel value='agents'>
            {/* Auto-detected type warning */}
            {transactionAgentsMeta?.is_auto_detected && (
              <Alert severity='info' sx={{ mb: 3 }}>
                <Typography variant='body2'>
                  This agent was automatically detected as a{' '}
                  <strong>{getAgentTypeDisplayName(transactionAgentsMeta.detected_type)}</strong> based on transaction
                  patterns ({transactionAgentsMeta.total_detected} agents transacted with).
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {getAgentTypeDescription(transactionAgentsMeta.detected_type)}
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  The agent type can be updated in agent settings.
                </Typography>
              </Alert>
            )}

            <Card sx={{ mb: 4 }}>
              <CardHeader
                title='Transaction-Detected Agents'
                subheader={
                  <Typography variant='body2' color='text.secondary'>
                    Agents detected based on deposit/transfer transactions to accounts starting with 01J7 (threshold:{' '}
                    {transactionAgentsMeta?.threshold || 10}+ transactions)
                  </Typography>
                }
              />
              <CardContent>
                {/* Summary chips */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    label={`Total Detected: ${transactionAgentsMeta?.total_detected || 0}`}
                    color='primary'
                    variant='outlined'
                  />
                  <Chip
                    label={`Assigned: ${transactionAgentsMeta?.assigned_count || 0}`}
                    color='success'
                    variant='outlined'
                  />
                  <Chip
                    label={`Unassigned: ${transactionAgentsMeta?.unassigned_count || 0}`}
                    color='warning'
                    variant='outlined'
                  />
                </Box>

                {/* Search and Filters */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Search by name or account number...'
                      value={transactionAgentSearchTerm}
                      onChange={e => setTransactionAgentSearchTerm(e.target.value)}
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
                      <InputLabel>Filter</InputLabel>
                      <Select
                        value={transactionAgentFilter}
                        label='Filter'
                        onChange={e => setTransactionAgentFilter(e.target.value as any)}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value='assigned'>Assigned</MenuItem>
                        <MenuItem value='unassigned'>Unassigned</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Rows per page</InputLabel>
                      <Select
                        value={transactionAgentRowsPerPage}
                        label='Rows per page'
                        onChange={e => setTransactionAgentRowsPerPage(Number(e.target.value))}
                      >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Transaction Agents Table */}
                {paginatedTransactionAgents.length > 0 ? (
                  <>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Agent Name</TableCell>
                            <TableCell>Account Number</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align='right'>Transactions</TableCell>
                            <TableCell align='right'>Total Amount</TableCell>
                            <TableCell>Last Transaction</TableCell>
                            <TableCell>Assignment</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedTransactionAgents.map(txAgent => (
                            <TableRow key={txAgent.account_number} hover>
                              <TableCell>
                                <Typography variant='body2' fontWeight='medium'>
                                  {txAgent.name}
                                </Typography>
                              </TableCell>
                              <TableCell>{txAgent.account_number}</TableCell>
                              <TableCell>
                                <Chip
                                  label={txAgent.type.replace('_', ' ').toUpperCase()}
                                  size='small'
                                  color='default'
                                  variant='outlined'
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={txAgent.is_active ? 'Active' : 'Inactive'}
                                  size='small'
                                  color={txAgent.is_active ? 'success' : 'error'}
                                  variant='outlined'
                                />
                              </TableCell>
                              <TableCell align='right'>{txAgent.transaction_count}</TableCell>
                              <TableCell align='right'>TZS {txAgent.total_amount?.toLocaleString() || 0}</TableCell>
                              <TableCell>
                                {txAgent.last_transaction_date
                                  ? new Date(txAgent.last_transaction_date).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={txAgent.is_assigned ? 'Assigned' : 'Unassigned'}
                                  size='small'
                                  color={txAgent.is_assigned ? 'success' : 'warning'}
                                  variant={txAgent.is_assigned ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                              <TableCell>
                                {txAgent.id ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      size='small'
                                      variant='outlined'
                                      startIcon={<Icon icon='tabler:eye' />}
                                      onClick={() => router.push(`/agents/view/${txAgent.id}`)}
                                    >
                                      View
                                    </Button>
                                    {txAgent.is_assigned ? (
                                      <Button
                                        size='small'
                                        variant='outlined'
                                        color='error'
                                        startIcon={<Icon icon='tabler:user-minus' />}
                                        onClick={() =>
                                          handleUnassignAgent(txAgent.id as number, txAgent.account_number)
                                        }
                                        disabled={assigningAgent === txAgent.account_number}
                                      >
                                        Unassign
                                      </Button>
                                    ) : (
                                      <Button
                                        size='small'
                                        variant='contained'
                                        color='primary'
                                        startIcon={<Icon icon='tabler:user-plus' />}
                                        onClick={() =>
                                          openAssignConfirmDialog(
                                            txAgent.id as number,
                                            txAgent.account_number,
                                            txAgent.parent_agent_id
                                          )
                                        }
                                        disabled={assigningAgent === txAgent.account_number}
                                      >
                                        Assign
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant='body2' color='text.secondary'>
                                    Not in system
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalTransactionAgentsPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                          count={totalTransactionAgentsPages}
                          page={transactionAgentPage}
                          onChange={(_, page) => setTransactionAgentPage(page)}
                          color='primary'
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {transactionAgentSearchTerm
                        ? 'No agents found matching your search criteria'
                        : 'No transaction-detected agents found.'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Manually Assigned Agents - keep as is */}
            <Card>
              <CardHeader
                title='Manually Assigned Agents'
                subheader={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {getFilteredAgents().length} of {associatedAgents.length} agents assigned to {agent.name}
                    </Typography>
                    <TextField
                      size='small'
                      placeholder='Search by name, account number, or ID...'
                      value={agentSearchTerm}
                      onChange={handleAgentSearch}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <Icon icon='tabler:search' />
                          </InputAdornment>
                        )
                      }}
                      sx={{ width: 300 }}
                    />
                  </Box>
                }
              />
              <CardContent>
                {getFilteredAgents().length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Agent Name</TableCell>
                          <TableCell>Account Number</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align='right'>Transactions</TableCell>
                          <TableCell align='right'>Total Amount</TableCell>
                          <TableCell>Assigned Date</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredAgents().map(assocAgent => (
                          <TableRow key={assocAgent.id} hover>
                            <TableCell>
                              <Typography variant='body2' fontWeight='medium'>
                                {assocAgent.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{assocAgent.account_number}</TableCell>
                            <TableCell>
                              <Chip
                                label={assocAgent.type.replace('_', ' ').toUpperCase()}
                                size='small'
                                color='default'
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assocAgent.is_active ? 'Active' : 'Inactive'}
                                size='small'
                                color={assocAgent.is_active ? 'success' : 'error'}
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell align='right'>{assocAgent.total_transactions}</TableCell>
                            <TableCell align='right'>TZS {assocAgent.total_amount.toLocaleString()}</TableCell>
                            <TableCell>{new Date(assocAgent.assigned_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  startIcon={<Icon icon='tabler:eye' />}
                                  onClick={() => router.push(`/agents/view/${Number(assocAgent.id)}`)}
                                >
                                  View
                                </Button>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  color='error'
                                  startIcon={<Icon icon='tabler:user-minus' />}
                                  onClick={() => handleUnassignAgent(Number(assocAgent.id), assocAgent.account_number)}
                                  disabled={assigningAgent === assocAgent.account_number}
                                >
                                  Unassign
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {agentSearchTerm
                        ? 'No agents found matching search criteria'
                        : `No agents manually assigned to ${agent.name}`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        )}

        {/* Transactions Tab */}
        {/* Transactions Tab - Enhanced with search and filter */}
        <TabPanel value='transactions'>
          <Card>
            <CardHeader title='Transaction History' />
            <CardContent>
              {/* Search and Filter Controls */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='Search by Transaction ID, Customer Name, Agent Name, or Narration...'
                    value={transactionSearchTerm}
                    onChange={e => setTransactionSearchTerm(e.target.value)}
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
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={transactionTypeFilter}
                      label='Type'
                      onChange={e => setTransactionTypeFilter(e.target.value)}
                    >
                      <MenuItem value='all'>All Types</MenuItem>
                      <MenuItem value='deposit'>Deposit</MenuItem>
                      <MenuItem value='withdrawal'>Withdrawal</MenuItem>
                      <MenuItem value='transfer'>Transfer</MenuItem>
                      <MenuItem value='payment'>Payment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Rows per page</InputLabel>
                    <Select
                      value={transactionRowsPerPage}
                      label='Rows per page'
                      onChange={e => setTransactionRowsPerPage(Number(e.target.value))}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => {
                      setTransactionSearchTerm('')
                      setTransactionTypeFilter('all')
                      setTransactionPage(0)
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>

              {/* Transaction Summary */}
              <Card variant='outlined' sx={{ mb: 4 }}>
                <CardContent>
                  <Grid container spacing={3} alignItems='center'>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Transactions
                      </Typography>
                      <Typography variant='h6'>{filteredTransactions.length.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Amount
                      </Typography>
                      <Typography variant='h6'>
                        TZS {filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                        By Type
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(() => {
                          const typeMap = new Map<string, { count: number; total: number }>()
                          filteredTransactions.forEach(t => {
                            const type = t.type || t.transaction_type || 'other'
                            const existing = typeMap.get(type) || { count: 0, total: 0 }
                            existing.count++
                            existing.total += t.amount
                            typeMap.set(type, existing)
                          })

                          return Array.from(typeMap.entries()).map(([type, data]) => (
                            <Chip
                              key={type}
                              label={`${type.toUpperCase()}: ${data.count} (TZS ${data.total.toLocaleString()})`}
                              size='small'
                              variant='outlined'
                            />
                          ))
                        })()}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Transaction DataGrid */}
              <Box sx={{ height: 500, width: '100%' }}>
                {filteredTransactions.length > 0 ? (
                  <>
                    <DataGrid
                      rows={paginatedTransactions}
                      columns={[
                        {
                          field: 'timestamp',
                          headerName: 'Date',
                          minWidth: 120,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography sx={{ color: 'text.secondary' }}>
                              {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : 'N/A'}
                            </Typography>
                          )
                        },
                        {
                          field: 'transactionId',
                          headerName: 'Reference',
                          minWidth: 150,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography variant='body2'>
                              {row.transactionId || row.reference || row.reference_number || 'N/A'}
                            </Typography>
                          )
                        },
                        {
                          field: 'type',
                          headerName: 'Type',
                          minWidth: 100,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Chip
                              label={(row.type || row.transaction_type || 'transaction').toUpperCase()}
                              size='small'
                              color={getTransactionTypeColor(row.type || row.transaction_type || 'transaction') as any}
                              variant='outlined'
                            />
                          )
                        },
                        {
                          field: 'customerName',
                          headerName: 'Customer',
                          minWidth: 150,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography variant='body2'>{row.customerName || 'N/A'}</Typography>
                          )
                        },
                        {
                          field: 'description',
                          headerName: 'Description',
                          minWidth: 200,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography variant='body2'>
                              {row.description || row.narration || row.type || row.transaction_type || 'N/A'}
                            </Typography>
                          )
                        },
                        {
                          field: 'amount',
                          headerName: 'Amount',
                          minWidth: 120,
                          type: 'number',
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography variant='body2' fontWeight='medium'>
                              TZS {row.amount.toLocaleString()}
                            </Typography>
                          )
                        },
                        {
                          field: 'commission_amount',
                          headerName: 'Commission',
                          minWidth: 120,
                          type: 'number',
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Typography variant='body2' color='text.secondary'>
                              TZS {(row.commission_amount || 0).toLocaleString()}
                            </Typography>
                          )
                        },
                        {
                          field: 'status',
                          headerName: 'Status',
                          minWidth: 100,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Chip
                              label={row.status}
                              size='small'
                              color={row.status === 'completed' ? 'success' : 'warning'}
                              variant='outlined'
                            />
                          )
                        },
                        {
                          field: 'actions',
                          headerName: 'Actions',
                          minWidth: 120,
                          sortable: false,
                          renderCell: ({ row }: { row: Transaction }) => (
                            <Tooltip title='View Invoice'>
                              <IconButton size='small' onClick={() => handleTransactionClick(row)} color='primary'>
                                <Icon icon='tabler:file-invoice' fontSize={20} />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      ]}
                      paginationModel={{ page: transactionPage, pageSize: transactionRowsPerPage }}
                      onPaginationModelChange={model => {
                        setTransactionPage(model.page)
                        setTransactionRowsPerPage(model.pageSize)
                      }}
                      pageSizeOptions={[10, 25, 50, 100]}
                      rowCount={filteredTransactions.length}
                      paginationMode='client'
                      disableRowSelectionOnClick
                    />
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {transactionSearchTerm
                        ? 'No transactions match your search criteria'
                        : `No transactions found for ${agent.name}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
        {/* Commission Tab */}
        {shouldShowAgentsTab() && (
          <TabPanel value='commission'>
            <Card sx={{ mb: 4 }}>
              <CardHeader
                title={`${agent?.type === 'super_agent' ? 'Super Agent' : 'Franchise'} Commission`}
                subheader={`Calculated for ${transactionAgents.filter(a => a.id !== null).length} detected agents`}
              />
              <CardContent>
                {/* Period Selector & Controls */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControl size='small' sx={{ minWidth: 180 }}>
                        <Select
                          value={selectedCommissionPeriod}
                          onChange={e => setSelectedCommissionPeriod(e.target.value)}
                        >
                          {getCommissionPeriodOptions().map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Search by agent name or account number...'
                      value={commissionSearchTerm}
                      onChange={e => {
                        setCommissionSearchTerm(e.target.value)
                        setCommissionPage(1)
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
                        value={commissionRowsPerPage}
                        label='Rows per page'
                        onChange={e => {
                          setCommissionRowsPerPage(Number(e.target.value))
                          setCommissionPage(1)
                        }}
                      >
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                        <MenuItem value={250}>250</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant='outlined'
                      size='small'
                      onClick={calculateCommissions}
                      startIcon={<Icon icon='tabler:refresh' />}
                    >
                      Recalculate
                    </Button>
                  </Grid>
                </Grid>

                {/* Summary Cards */}
                {commissionData.length > 0 && (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={6} md={3}>
                      <Card variant='outlined' sx={{ textAlign: 'center', p: 2 }}>
                        <Icon icon='tabler:users' fontSize='1.5rem' color='primary' />
                        <Typography variant='h5' sx={{ mt: 1, fontWeight: 600 }}>
                          {commissionData.length}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Agents Served
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant='outlined' sx={{ textAlign: 'center', p: 2 }}>
                        <Icon icon='tabler:currency-dollar' fontSize='1.5rem' color='success' />
                        <Typography variant='h5' sx={{ mt: 1, fontWeight: 600 }}>
                          TZS {commissionData.reduce((sum, c) => sum + (c.finalCommission || 0), 0).toLocaleString()}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Total Commission
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant='outlined' sx={{ textAlign: 'center', p: 2 }}>
                        <Icon icon='tabler:exchange' fontSize='1.5rem' color='warning' />
                        <Typography variant='h5' sx={{ mt: 1, fontWeight: 600 }}>
                          {commissionData.reduce((sum, c) => sum + (c.transactionCount || 0), 0).toLocaleString()}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Total Transactions
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant='outlined' sx={{ textAlign: 'center', p: 2 }}>
                        <Icon icon='tabler:chart-bar' fontSize='1.5rem' color='info' />
                        <Typography variant='h5' sx={{ mt: 1, fontWeight: 600 }}>
                          TZS{' '}
                          {(commissionData.length > 0
                            ? commissionData.reduce((sum, c) => sum + (c.finalCommission || 0), 0) /
                              commissionData.length
                            : 0
                          ).toLocaleString()}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Avg Commission
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Commission Table */}
                {commissionLoading ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress />
                    <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
                      Calculating commissions for {transactionAgents.filter(a => a.id !== null).length} agents...
                    </Typography>
                  </Box>
                ) : commissionData.length > 0 ? (
                  <>
                    <TableContainer component={Paper}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                            {agent?.type === 'franchise' && (
                              <TableCell align='right' sx={{ fontWeight: 600 }}>
                                Capital Advanced
                              </TableCell>
                            )}
                            <TableCell align='right' sx={{ fontWeight: 600 }}>
                              Agent Transactions
                            </TableCell>
                            <TableCell align='center' sx={{ fontWeight: 600 }}>
                              Tx Count
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>Performance</TableCell>
                            <TableCell align='right' sx={{ fontWeight: 600 }}>
                              Commission
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedCommissionData.map((calc, index) => {
                            let perfLabel: { label: string; color: any }
                            let perfValue: number

                            if (agent?.type === 'super_agent') {
                              perfValue = (calc as any).kpiScore || 0
                              perfLabel = getSuperAgentPerformanceLabel(perfValue)
                            } else {
                              perfValue = (calc as any).performancePct || 0
                              perfLabel = getFranchisePerformanceLabel((calc as any).payband || '')
                            }

                            return (
                              <TableRow key={index} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant='body2' fontWeight='medium'>
                                      {calc.agentName}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {calc.accountNumber}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                {agent?.type === 'franchise' && (
                                  <TableCell align='right'>
                                    <Typography variant='body2'>
                                      TZS {(calc as any).capitalAdvanced?.toLocaleString() || 'N/A'}
                                    </Typography>
                                    {(calc as any).expectedTurnover > 0 && (
                                      <Typography variant='caption' color='text.secondary' display='block'>
                                        Expected: TZS {(calc as any).expectedTurnover?.toLocaleString()}
                                      </Typography>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell align='right'>
                                  <Typography variant='body2' fontWeight='medium'>
                                    TZS {calc.totalTransactions?.toLocaleString() || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Typography variant='body2'>{calc.transactionCount}</Typography>
                                </TableCell>
                                <TableCell>
                                  {/* Performance Label ABOVE the progress bar */}
                                  <Box sx={{ mb: 0.5 }}>
                                    <Chip
                                      label={`${perfLabel.label} (${perfValue.toFixed(0)}%)`}
                                      size='small'
                                      color={perfLabel.color}
                                      variant='outlined'
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  </Box>
                                  {/* Progress Bar BELOW the label */}
                                  <LinearProgress
                                    variant='determinate'
                                    value={Math.min(perfValue, 100)}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor:
                                          perfValue >= 80
                                            ? 'success.main'
                                            : perfValue >= 60
                                            ? 'primary.main'
                                            : perfValue >= 40
                                            ? 'warning.main'
                                            : 'error.main'
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2' fontWeight='bold' color='success.main'>
                                    TZS {calc.finalCommission?.toLocaleString() || 0}
                                  </Typography>
                                  {(calc as any).clawback > 0 && (
                                    <Typography variant='caption' color='error.main' display='block'>
                                      Clawback: TZS {(calc as any).clawback?.toLocaleString()}
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalCommissionPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Showing {paginatedCommissionData.length} of {filteredCommissionData.length} agents
                        </Typography>
                        <Pagination
                          count={totalCommissionPages}
                          page={commissionPage}
                          onChange={(_, page) => setCommissionPage(page)}
                          color='primary'
                          showFirstButton
                          showLastButton
                          size='medium'
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Icon icon='tabler:calculator' fontSize='3rem' color='text.secondary' />
                    <Typography variant='h6' sx={{ mt: 2 }}>
                      No Commission Data
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      Click "Recalculate" to compute commissions for the selected period.
                    </Typography>
                    <Button
                      variant='outlined'
                      onClick={calculateCommissions}
                      startIcon={<Icon icon='tabler:refresh' />}
                    >
                      Recalculate
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        )}
      </TabContext>
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialogConfig?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button
            onClick={confirmDialogConfig?.type === 'unassign' ? handleConfirmUnassign : handleConfirmAction}
            variant='contained'
            color={confirmDialogConfig?.type === 'unassign' ? 'error' : 'primary'}
          >
            {confirmDialogConfig?.type === 'assign'
              ? 'Assign'
              : confirmDialogConfig?.type === 'unassign'
              ? 'Unassign'
              : 'Reassign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

AgentView.acl = {
  action: 'read',
  subject: 'agent-management'
}

export default AgentView
