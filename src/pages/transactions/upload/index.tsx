import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Typography, Button, Alert, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material'
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

  const handleUploadComplete = async (result: any) => {
    setLoading(false)
    setUploadResult(result)

    if (result.success) {
      setStats(result.stats)
      setActiveStep(3)
    } else {
      // Stay on upload step to show error
      console.error('Upload failed:', result.message)
    }
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
  }

  const handleViewTransactions = () => {
    router.push('/transactions/list')
  }

  const handleDownloadTemplate = () => {
    // Create CSV template for transactions
    const template = [
      [
        'TRANSACTIONID',
        'AGENTSNAME',
        'AGNTACCNT',
        'BRC',
        'BRCHNAME',
        'TRXDATE',
        'NARRATION',
        'AMOUNT',
        'CSTMNAME',
        'CSTMACCNT',
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
        '50000',
        'Alice Customer',
        'CUST001',
        'AGENCY'
      ].join(','),
      [
        'TXN002',
        'Jane Agent',
        'AGT002',
        'BR002',
        'Arusha Branch',
        '02/10/2025 14:20',
        'Customer Withdrawal',
        '25000',
        'Bob Customer',
        'CUST002',
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
            Select a CSV file containing transaction data to upload to the system.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <StreamingFileUpload
              onUploadComplete={handleUploadComplete}
              onError={handleError}
              acceptedFileTypes={['.csv']}
              maxFileSize={100 * 1024 * 1024} // 100MB
            />
          </Box>
        </Box>
      )
    },
    {
      title: 'Preview Data',
      icon: 'tabler:eye',
      content: (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Icon icon='tabler:eye' fontSize={64} color='info' />
          </Box>
          <Typography variant='h6' gutterBottom>
            Preview Transaction Data
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
            Review your data before uploading to ensure accuracy.
          </Typography>
          <Alert severity='info' sx={{ mb: 4 }}>
            <Typography variant='body2'>
              The system will automatically create or update agent records and process transactions. Required fields:
              Transaction ID, Agent Name, Agent Account, Amount
            </Typography>
          </Alert>
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
          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
            Your file is being processed. This may take a few moments depending on file size.
          </Typography>
          {loading && (
            <Box sx={{ mt: 4 }}>
              <Typography variant='body2' color='primary'>
                Processing transactions...
              </Typography>
            </Box>
          )}
          {!loading && uploadResult && !uploadResult.success && (
            <Alert severity='error' sx={{ mt: 4 }}>
              <Typography variant='body2'>{uploadResult.message}</Typography>
            </Alert>
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
              <Typography variant='h6' color='success.main' gutterBottom>
                Upload Successful!
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:file-text' color='primary' />
                  </ListItemIcon>
                  <ListItemText primary='Total Rows Processed' secondary={stats.totalRows?.toLocaleString() || '0'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:check' color='success' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Successfully Processed'
                    secondary={stats.processedRows?.toLocaleString() || '0'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:users' color='info' />
                  </ListItemIcon>
                  <ListItemText primary='New Agents Created' secondary={stats.newAgents?.toLocaleString() || '0'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:receipt' color='warning' />
                  </ListItemIcon>
                  <ListItemText
                    primary='New Transactions Added'
                    secondary={stats.newTransactions?.toLocaleString() || '0'}
                  />
                </ListItem>
              </List>
              {stats.errors && stats.errors.length > 0 && (
                <Alert severity='error' sx={{ mt: 4 }}>
                  <Typography variant='h6' gutterBottom>
                    Processing Errors ({stats.errors.length})
                  </Typography>
                  <Box component='ul' sx={{ pl: 2 }}>
                    {stats.errors.slice(0, 5).map(error => (
                      <Typography component='li' key={error} variant='body2'>
                        {error}
                      </Typography>
                    ))}
                    {stats.errors.length > 5 && (
                      <Typography variant='body2' color='text.secondary'>
                        ... and {stats.errors.length - 5} more errors
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}
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
      actionButtons={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<Icon icon='tabler:download' />} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          {activeStep > 0 && (
            <Button variant='outlined' startIcon={<Icon icon='tabler:eye' />} onClick={handleViewTransactions}>
              View Transactions
            </Button>
          )}
        </Box>
      }
    />
  )
}

// ** ACL Configuration - Allow authenticated users to upload transactions
;(TransactionUpload as any).acl = {
  action: 'create',
  subject: 'transactions'
}

export default TransactionUpload
