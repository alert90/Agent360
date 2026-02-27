import React, { useState, useEffect } from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Card, CardContent, Typography, Grid } from '@mui/material'
import DataTable from 'src/components/DataTable'
import { db, transactions, agents } from 'src/lib/db'
import { eq, desc, sql } from 'drizzle-orm'

const TransactionsDashboard: React.FC = () => {
  const [transactionData, setTransactionData] = useState<any[]>([])
  const [agentData, setAgentData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    totalAgents: 0,
    avgTransactionAmount: 0
  })

  // Transaction columns
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
      field: 'location',
      headerName: 'Location',
      minWidth: 120
    },
    {
      field: 'zone',
      headerName: 'Zone',
      minWidth: 100
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      type: 'date',
      minWidth: 120
    }
  ]

  // Agent columns
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
      field: 'type',
      headerName: 'Agent Type',
      minWidth: 120
    },
    {
      field: 'branchName',
      headerName: 'Branch',
      minWidth: 150
    },
    {
      field: 'totalTransactionAmount',
      headerName: 'Total Amount',
      type: 'currency',
      minWidth: 120
    },
    {
      field: 'transactionCount',
      headerName: 'Transaction Count',
      type: 'number',
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

  // Filter options for transactions
  const transactionFilterOptions = [
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
    },
    {
      field: 'zone',
      label: 'Zone',
      options: [
        { value: 'all', label: 'All Zones' },
        { value: 'Dar es Salaam', label: 'Dar es Salaam' },
        { value: 'Northern', label: 'Northern' },
        { value: 'Lake Zone', label: 'Lake Zone' },
        { value: 'Central', label: 'Central' },
        { value: 'Other', label: 'Other' }
      ]
    }
  ]

  // Filter options for agents
  const agentFilterOptions = [
    {
      field: 'type',
      label: 'Agent Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'local_agent', label: 'Local Agent' },
        { value: 'super_agent', label: 'Super Agent' },
        { value: 'franchise', label: 'Franchise' }
      ]
    },
    {
      field: 'isActive',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load transactions
      const transactionsData = await db.select().from(transactions).orderBy(desc(transactions.timestamp)).limit(1000)

      // Load agents
      const agentsData = await db.select().from(agents).orderBy(desc(agents.totalTransactionAmount)).limit(1000)

      // Calculate stats
      const totalAmount = transactionsData.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      const avgAmount = transactionsData.length > 0 ? totalAmount / transactionsData.length : 0

      setStats({
        totalTransactions: transactionsData.length,
        totalAmount,
        totalAgents: agentsData.length,
        avgTransactionAmount: avgAmount
      })

      setTransactionData(transactionsData)
      setAgentData(agentsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleExportTransactions = () => {
    // Custom export logic for transactions
    const csvContent = [
      ['Transaction ID', 'Agent Name', 'Customer Name', 'Type', 'Amount', 'Status', 'Location', 'Zone', 'Date'].join(
        ','
      ),
      ...transactionData.map(tx =>
        [
          tx.transactionId,
          tx.agentName,
          tx.customerName,
          tx.type,
          tx.amount,
          tx.status,
          tx.location,
          tx.zone,
          tx.timestamp
        ].join(',')
      )
    ].join('\n')

    downloadCSV(csvContent, 'transactions_export')
  }

  const handleExportAgents = () => {
    // Custom export logic for agents
    const csvContent = [
      [
        'Account Number',
        'Agent Name',
        'Type',
        'Branch',
        'Total Amount',
        'Transaction Count',
        'Commission',
        'Status'
      ].join(','),
      ...agentData.map(agent =>
        [
          agent.accountNumber,
          agent.name,
          agent.type,
          agent.branchName,
          agent.totalTransactionAmount,
          agent.transactionCount,
          agent.commissionAmount,
          agent.isActive ? 'Active' : 'Inactive'
        ].join(',')
      )
    ].join('\n')

    downloadCSV(csvContent, 'agents_export')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Commission Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                {stats.totalTransactions.toLocaleString()}
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
              <Typography variant='h6' color='success.main'>
                TZS {stats.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Amount Transacted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='info.main'>
                {stats.totalAgents.toLocaleString()}
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
              <Typography variant='h6' color='warning.main'>
                TZS {stats.avgTransactionAmount.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Avg Transaction Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      <DataTable
        data={transactionData}
        columns={transactionColumns}
        title='Recent Transactions'
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExportTransactions}
        searchPlaceholder='Search transactions...'
        filterOptions={transactionFilterOptions}
      />

      {/* Agents Table */}
      <DataTable
        data={agentData}
        columns={agentColumns}
        title='Agents Performance'
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExportAgents}
        searchPlaceholder='Search agents...'
        filterOptions={agentFilterOptions}
      />
    </Box>
  )
}

export default TransactionsDashboard
