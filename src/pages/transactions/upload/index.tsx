import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import StreamingFileUpload from 'src/components/StreamingFileUpload'
import TransactionUploadWizard, { TransactionUploadStep } from 'src/components/TransactionUploadWizard'

interface UploadStats {
  totalRows: number
  processedRows: number
  failedRows: number
  newAgents: number
  newTransactions: number
  errors: string[]
}

const TransactionUpload: React.FC = () => {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<UploadStats | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file selection to move to next step
  const handleFileSelected = () => {
    setActiveStep(1) // Move to Upload & Process step
    setLoading(true)
  }

  const handleUploadComplete = (result: any) => {
    setLoading(false)
    setUploadResult(result)

    if (result.success) {
      setStats({
        totalRows: result.stats?.total || 0,
        processedRows: result.stats?.created || 0,
        failedRows: result.stats?.skipped || 0,
        newAgents: result.stats?.newAgents || 0,
        newTransactions: result.stats?.created || 0,
        errors: result.errors || []
      })
      setActiveStep(2) // Move to Review Results step
    }
  }

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress)
  }

  const handleError = (error: string) => {
    setLoading(false)
    console.error('Upload error:', error)
  }

  const handleReset = () => {
    setActiveStep(0)
    setUploadResult(null)
    setStats(null)
    setLoading(false)
    setUploadProgress(0)
  }

  const handleViewTransactions = () => {
    router.push('/transactions/list')
  }

  const handleUploadAnother = () => {
    handleReset()
  }

  const handleDownloadTemplate = () => {
    const template = [
      [
        'TRANSACTIONID1',
        'AGENTSNAME',
        'AGNTACCNT',
        'BRC',
        'BRCHNAME',
        'TRXDATE',
        'NARRATION',
        'AMOUNTDEBIT',
        'AMOUNTCREDIT',
        'CSTMACCNT',
        'CSTMNAME',
        'CHANNEL'
      ].join(','),
      [
        'TXN001',
        'John Agent',
        'AGT001',
        'BR001',
        'Dar es Salaam Branch',
        '01/10/2025 10:30',
        'Customer Deposit',
        '0',
        '50000',
        'CUST001',
        'Alice Customer',
        'AGENCY'
      ].join(',')
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'transaction_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const steps: TransactionUploadStep[] = [
    {
      title: 'Select File',
      icon: 'tabler:upload',
      content: (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Icon icon='tabler:upload' fontSize={64} color='primary' />
          </Box>
          <Typography variant='h6' gutterBottom>
            Upload Transaction CSV File
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
            Select a CSV file containing transaction data to upload
          </Typography>
          <Box sx={{ mt: 4 }}>
            <StreamingFileUpload
              onUploadStart={handleFileSelected}
              onUploadComplete={handleUploadComplete}
              onUploadProgress={handleUploadProgress}
              onError={handleError}
              acceptedFileTypes={['.csv']}
              maxFileSize={500 * 1024 * 1024}
            />
          </Box>
        </Box>
      )
    },
    {
      title: 'Upload & Process',
      icon: 'tabler:cloud-upload',
      content: (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Icon icon='tabler:cloud-upload' fontSize={64} color='warning' />
          </Box>
          <Typography variant='h6' gutterBottom>
            Uploading & Processing
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Please wait while your file is being processed
          </Typography>

          {loading && (
            <Box sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>
              <LinearProgress variant='determinate' value={uploadProgress} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
              <Typography variant='body2' color='text.secondary'>
                {uploadProgress < 30
                  ? 'Parsing CSV file...'
                  : uploadProgress < 80
                  ? 'Uploading transactions...'
                  : 'Finalizing...'}{' '}
                ({Math.round(uploadProgress)}%)
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                This may take a few minutes depending on file size
              </Typography>
            </Box>
          )}
        </Box>
      )
    },
    {
      title: 'Review Results',
      icon: 'tabler:check',
      content: (
        <Box sx={{ py: 4 }}>
          <Typography variant='h6' gutterBottom>
            Upload Results
          </Typography>
          {stats && (
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon icon='tabler:check' fontSize={24} color='white' />
                </Box>
                <Box>
                  <Typography variant='h5' color='success.main' gutterBottom>
                    Upload Complete!
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Your transactions have been successfully imported
                  </Typography>
                </Box>
              </Box>

              <List sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:file-text' color='primary' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Total Rows'
                    secondary={stats.totalRows?.toLocaleString() || '0'}
                    secondaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:check' color='success' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Successfully Created'
                    secondary={stats.processedRows?.toLocaleString() || '0'}
                    secondaryTypographyProps={{ variant: 'h6', color: 'success.main' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:users' color='info' />
                  </ListItemIcon>
                  <ListItemText
                    primary='New Agents Created'
                    secondary={stats.newAgents?.toLocaleString() || '0'}
                    secondaryTypographyProps={{ variant: 'h6', color: 'info.main' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:receipt' color='warning' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Transactions Added'
                    secondary={stats.newTransactions?.toLocaleString() || '0'}
                    secondaryTypographyProps={{ variant: 'h6', color: 'warning.main' }}
                  />
                </ListItem>
                {stats.failedRows > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon='tabler:alert-triangle' color='error' />
                    </ListItemIcon>
                    <ListItemText
                      primary='Skipped/Failed'
                      secondary={stats.failedRows?.toLocaleString() || '0'}
                      secondaryTypographyProps={{ variant: 'h6', color: 'error.main' }}
                    />
                  </ListItem>
                )}
              </List>

              {stats.errors && stats.errors.length > 0 && (
                <Alert severity='warning' sx={{ mt: 4 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    {stats.errors.length} errors occurred
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {stats.errors.slice(0, 5).map((error, idx) => (
                      <Typography key={idx} variant='caption' display='block' sx={{ mt: 1 }}>
                        • {error.transaction ? `TXN ${error.transaction}: ` : ''}
                        {error.error || error}
                      </Typography>
                    ))}
                    {stats.errors.length > 5 && (
                      <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                        And {stats.errors.length - 5} more errors...
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant='contained'
                  startIcon={<Icon icon='tabler:eye' />}
                  onClick={handleViewTransactions}
                  size='large'
                >
                  View Transactions
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:upload' />}
                  onClick={handleUploadAnother}
                  size='large'
                >
                  Upload Another File
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )
    }
  ]

  return (
    <TransactionUploadWizard
      steps={steps}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      onReset={handleReset}
      loading={loading}
      hideStepNavigation={activeStep === 1} // Hide navigation during upload
      actionButtons={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<Icon icon='tabler:download' />} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          {activeStep === 2 && (
            <Button variant='contained' startIcon={<Icon icon='tabler:eye' />} onClick={handleViewTransactions}>
              View All Transactions
            </Button>
          )}
        </Box>
      }
    />
  )
}

TransactionUpload.acl = {
  action: 'create',
  subject: 'transactions'
}

export default TransactionUpload
