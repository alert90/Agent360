import React, { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { useAuth } from 'src/hooks/useAuth'
import DataTable from 'src/components/DataTable'
import { GridColDef } from '@mui/x-data-grid'

interface FranchiseStats {
  totalAgents: number
  totalTransactions: number
  totalAmount: number
  totalCommission: number
}

const FranchiseDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<FranchiseStats>({
    totalAgents: 0,
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0
  })
  const [agentData, setAgentData] = useState<any[]>([])

  // const [transactionData, setTransactionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFranchiseData = async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        console.error('No user ID found')

        return
      }

      // Fetch data from API instead of direct database access
      const response = await fetch('/api/dashboard/franchise')
      if (!response.ok) {
        throw new Error('Failed to fetch franchise data')
      }

      const data = await response.json()

      // Map API response to component state
      setStats({
        totalAgents: data.summary?.agentsServed?.totalAgents || 0,
        totalTransactions: data.summary?.transactions?.totalTransactions || 0,
        totalAmount: data.summary?.transactions?.totalAmount || 0,
        totalCommission: data.summary?.commission?.totalCommission || 0
      })

      // Use super agent performance data for agents table
      setAgentData(data.superAgentPerformance || [])

      // Use recent transactions for transactions table
      setTransactionData(data.recentTransactions || [])
    } catch (error) {
      console.error('Failed to fetch franchise dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFranchiseData()
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
      field: 'account_number',
      headerName: 'Account Number',
      minWidth: 150
    },
    {
      field: 'name',
      headerName: 'Agent Name',
      minWidth: 150
    },
    {
      field: 'branch_name',
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
      field: 'totalAmount',
      headerName: 'Total Amount',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'commissionEarned',
      headerName: 'Commission',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 80,
      valueFormatter: () => <span style={{ color: 'green' }}>Active</span>
    }
  ]

  // // Transaction columns for data table
  // const transactionColumns: GridColDef[] = [
  //   {
  //     field: 'transaction_id',
  //     headerName: 'Transaction ID',
  //     minWidth: 150
  //   },
  //   {
  //     field: 'agent_name',
  //     headerName: 'Agent Name',
  //     minWidth: 150
  //   },
  //   {
  //     field: 'customer_name',
  //     headerName: 'Customer Name',
  //     minWidth: 150
  //   },
  //   {
  //     field: 'type',
  //     headerName: 'Type',
  //     minWidth: 100
  //   },
  //   {
  //     field: 'amount',
  //     headerName: 'Amount',
  //     type: 'currency',
  //     minWidth: 120
  //   },
  //   {
  //     field: 'status',
  //     headerName: 'Status',
  //     minWidth: 100
  //   },
  //   {
  //     field: 'timestamp',
  //     headerName: 'Date',
  //     type: 'date',
  //     minWidth: 120
  //   }
  // ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Franchise Dashboard
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Overview of your franchise performance and agent network
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} mb={3}>
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
        <Grid item xs={12} sm={6} mb={3}>
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

      {/* Performance Summary */}
      <Grid item xs={12} md={6} mb={3}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Network Performance
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Active Agents
              </Typography>
              <Typography variant='h6' color='primary.main'>
                {formatNumber(stats.totalAgents)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Total Volume
              </Typography>
              <Typography variant='h6' color='success.main'>
                {formatCurrency(stats.totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                Commission Earned
              </Typography>
              <Typography variant='h6' color='warning.main'>
                {formatCurrency(stats.totalCommission)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Average Metrics
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Avg per Agent
              </Typography>
              <Typography variant='h6' color='info.main'>
                {stats.totalAgents > 0 ? formatCurrency(stats.totalAmount / stats.totalAgents) : 'TZS 0'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Avg Transactions
              </Typography>
              <Typography variant='h6' color='primary.main'>
                {stats.totalAgents > 0 ? formatNumber(Math.round(stats.totalTransactions / stats.totalAgents)) : '0'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                Avg Commission
              </Typography>
              <Typography variant='h6' color='success.main'>
                {stats.totalAgents > 0 ? formatCurrency(stats.totalCommission / stats.totalAgents) : 'KES 0'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid> */}

      {/* Agents Table */}
      <DataTable
        data={agentData}
        columns={agentColumns}
        title='Your Agents'
        loading={loading}
        onRefresh={fetchFranchiseData}
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
    </Box>
  )
}

// ** ACL Configuration - Franchise can view their network stats
FranchiseDashboard.acl = {
  action: 'read',
  subject: 'dashboard'
}

export default FranchiseDashboard
