import React, { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import DataTable from 'src/components/DataTable'
import { GridColDef } from '@mui/x-data-grid'

interface SuperAgentStats {
  totalAgents: number
  totalTransactions: number
  totalAmount: number
  totalCommission: number
}

const SuperAgentDashboard = () => {
  const [stats, setStats] = useState<SuperAgentStats>({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0
  })
  const [agentData, setAgentData] = useState<any[]>([])
  const [transactionData, setTransactionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuperAgentData = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Fetch agents data
      const agentsResponse = await fetch('/api/agents/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!agentsResponse.ok) {
        throw new Error('Failed to fetch agents')
      }

      const agentsResult = await agentsResponse.json()

      // Fetch transactions data
      const transactionsResponse = await fetch('/api/transactions/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const transactionsResult = await transactionsResponse.json()

      if (agentsResult.success && transactionsResult.success) {
        // Calculate stats from agents data
        const totalAgents = agentsResult.data.length
        const totalTransactions = agentsResult.data.reduce(
          (sum: number, agent: any) => sum + (agent.transaction_count || 0),
          0
        )
        const totalAmount = agentsResult.data.reduce(
          (sum: number, agent: any) => sum + (agent.total_transaction_amount || 0),
          0
        )
        const totalCommission = agentsResult.data.reduce(
          (sum: number, agent: any) => sum + (agent.commission_amount || 0),
          0
        )

        setStats({
          totalAgents,
          totalTransactions,
          totalAmount,
          totalCommission
        })

        setAgentData(agentsResult.data)
        setTransactionData(transactionsResult.data)
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Failed to fetch super agent dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuperAgentData()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Agent columns for data table
  const agentColumns: GridColDef[] = [
    {
      field: 'accountNumber',
      headerName: 'Account Number',
      minWidth: 150
    },
    {
      field: 'name',
      headerName: 'Agent Name',
      minWidth: 150
    },
    {
      field: 'branchName',
      headerName: 'Branch',
      minWidth: 120
    },
    {
      field: 'transactionCount',
      headerName: 'Transactions',
      type: 'number',
      minWidth: 100
    },
    {
      field: 'totalTransactionAmount',
      headerName: 'Total Amount',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'commissionAmount',
      headerName: 'Commission',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 80,
      valueFormatter: ({ value }) => (
        <span style={{ color: value ? 'green' : 'red' }}>{value ? 'Active' : 'Inactive'}</span>
      )
    }
  ]

  // Transaction columns for data table
  const transactionColumns: GridColDef[] = [
    {
      field: 'transactionId',
      headerName: 'Transaction ID',
      minWidth: 150
    },
    {
      field: 'agentName',
      headerName: 'Agent Name',
      minWidth: 150
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      minWidth: 150
    },
    {
      field: 'type',
      headerName: 'Type',
      minWidth: 100
    },
    {
      field: 'amount',
      headerName: 'Amount',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      type: 'date',
      minWidth: 120
    }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Super Agent Dashboard
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Manage your agents and track their performance
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                {formatNumber(stats.totalAgents)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='success.main'>
                {formatNumber(stats.totalTransactions)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='warning.main'>
                {formatCurrency(stats.totalAmount)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='info.main'>
                {formatCurrency(stats.totalCommission)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agents Table */}
      <DataTable
        data={agentData}
        columns={agentColumns}
        title='Your Agents'
        loading={loading}
        onRefresh={fetchSuperAgentData}
        searchPlaceholder='Search agents...'
        filterOptions={[
          {
            field: 'isActive',
            label: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]
          }
        ]}
      />

      {/* Transactions Table */}
      <DataTable
        data={transactionData}
        columns={transactionColumns}
        title='Agent Transactions'
        loading={loading}
        onRefresh={fetchSuperAgentData}
        searchPlaceholder='Search transactions...'
        filterOptions={[
          {
            field: 'type',
            label: 'Transaction Type',
            options: [
              { value: 'all', label: 'All Types' },
              { value: 'deposit', label: 'Deposit' },
              { value: 'withdrawal', label: 'Withdrawal' },
              { value: 'transfer', label: 'Transfer' }
            ]
          },
          {
            field: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' }
            ]
          }
        ]}
      />
    </Box>
  )
}

// ** ACL Configuration - Super Agent can manage their agents
SuperAgentDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default SuperAgentDashboard
