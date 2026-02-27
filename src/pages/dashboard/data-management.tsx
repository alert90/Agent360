import React, { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, Button, Tabs, Tab, Alert, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import StreamingFileUpload from 'src/components/StreamingFileUpload'
import axios from 'axios'

// ** Styled Components
const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 48,
  fontWeight: 600,
  textTransform: 'none',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}))

const TabPanel = (props: { children?: React.ReactNode; value: number; index: number }) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`data-management-tabpanel-${index}`}
      aria-labelledby={`data-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface UploadStats {
  totalFiles: number
  totalRecords: number
  totalAgents: number
  totalAmount: number
  lastUpload?: string
  processingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  currentProgress?: number
}

interface SystemStats {
  agents: number
  transactions: number
  commissions: number
  totalAmount: number
  avgTransactionAmount: number
  topPerformingAgent?: {
    name: string
    amount: number
    transactions: number
  }
}

const DataManagementDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalFiles: 0,
    totalRecords: 0,
    totalAgents: 0,
    totalAmount: 0,
    processingStatus: 'idle'
  })
  const [systemStats, setSystemStats] = useState<SystemStats>({
    agents: 0,
    transactions: 0,
    commissions: 0,
    totalAmount: 0,
    avgTransactionAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get('/api/stats/overview')
      if (response.data.success) {
        setSystemStats(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
      setError('Failed to load system statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleUploadComplete = (result: any) => {
    if (result.success) {
      setUploadStats(prev => ({
        ...prev,
        totalFiles: prev.totalFiles + 1,
        totalRecords: prev.totalRecords + (result.stats?.processedTransactions || 0),
        totalAmount: prev.totalAmount + (result.stats?.totalAmount || 0),
        processingStatus: 'completed',
        lastUpload: new Date().toISOString()
      }))

      // Refresh system stats after upload
      fetchSystemStats()
    } else {
      setUploadStats(prev => ({
        ...prev,
        processingStatus: 'error'
      }))
      setError('Upload failed')
    }
  }

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

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' gutterBottom>
          Data Management Dashboard
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Upload CSV files and manage your agent and transaction data
        </Typography>
      </Grid>

      {/* System Overview Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:users' fontSize='2rem' color='primary' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatNumber(systemStats.agents)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Agents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:receipt' fontSize='2rem' color='success' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatNumber(systemStats.transactions)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Transactions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:currency-dollar' fontSize='2rem' color='warning' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatCurrency(systemStats.totalAmount)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                <Icon icon='tabler:chart-line' fontSize='2rem' color='info' />
              </Box>
              <Box>
                <Typography variant='h4'>{formatCurrency(systemStats.avgTransactionAmount)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Avg Transaction
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Main Content Tabs */}
      <Grid item xs={12}>
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label='data management tabs'>
              <StyledTab icon={<Icon icon='tabler:upload' />} label='Upload Data' />
              <StyledTab icon={<Icon icon='tabler:database' />} label='View Agents' />
              <StyledTab icon={<Icon icon='tabler:receipt' />} label='View Transactions' />
              <StyledTab icon={<Icon icon='tabler:chart-bar' />} label='Analytics' />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <Box>
              <Typography variant='h6' gutterBottom>
                Upload CSV Files
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                Upload your CSV files with agent and transaction data. Files are processed in chunks to handle large
                datasets efficiently.
              </Typography>

              {uploadStats.processingStatus === 'processing' && (
                <Alert severity='info' sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 2 }} />
                    Processing upload... {uploadStats.currentProgress?.toFixed(1)}%
                  </Box>
                </Alert>
              )}

              {uploadStats.processingStatus === 'completed' && (
                <Alert severity='success' sx={{ mb: 3 }}>
                  Upload completed successfully!
                </Alert>
              )}

              {uploadStats.processingStatus === 'error' && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {error || 'Upload failed. Please try again.'}
                </Alert>
              )}

              <StreamingFileUpload onUploadComplete={handleUploadComplete} />

              {/* Upload Statistics */}
              <Card sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Upload Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Files Uploaded
                      </Typography>
                      <Typography variant='h5'>{uploadStats.totalFiles}</Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Records Processed
                      </Typography>
                      <Typography variant='h5'>{formatNumber(uploadStats.totalRecords)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Amount Processed
                      </Typography>
                      <Typography variant='h5'>{formatCurrency(uploadStats.totalAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='body2' color='text.secondary'>
                        Last Upload
                      </Typography>
                      <Typography variant='h5'>
                        {uploadStats.lastUpload ? new Date(uploadStats.lastUpload).toLocaleDateString() : 'Never'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' gutterBottom>
                View Agents
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                Browse and manage all agents in the system
              </Typography>
              <Button variant='contained' size='large' href='/agents/list' startIcon={<Icon icon='tabler:users' />}>
                Go to Agents List
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' gutterBottom>
                View Transactions
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                Browse and filter all transactions in the system
              </Typography>
              <Button variant='contained' size='large' href='/agents/list' startIcon={<Icon icon='tabler:receipt' />}>
                Go to Transactions
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' gutterBottom>
                Analytics & Reports
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                View detailed analytics and generate reports
              </Typography>
              <Button
                variant='contained'
                size='large'
                href='/commission/report'
                startIcon={<Icon icon='tabler:chart-bar' />}
              >
                Go to Analytics
              </Button>
            </Box>
          </TabPanel>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:download' />}
                  href='/commission/report'
                >
                  Generate Report
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant='outlined' startIcon={<Icon icon='tabler:users' />} href='/agents/list'>
                  Manage Agents
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:settings' />}
                  href='/commission-configs'
                >
                  Configure System
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Icon icon='tabler:refresh' />}
                  onClick={fetchSystemStats}
                >
                  Refresh Data
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DataManagementDashboard
