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
      setActiveStep(3)
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
              onUploadComplete={handleUploadComplete}
              onError={handleError}
              acceptedFileTypes={['.csv']}
              maxFileSize={500 * 1024 * 1024}
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
            Review your data before uploading
          </Typography>
          <Alert severity='info' sx={{ mb: 4 }}>
            <Typography variant='body2'>
              The system will automatically create agents from the AGNTACCNT field
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
            Your file is being processed
          </Typography>
          {loading && (
            <Box sx={{ mt: 4 }}>
              <Typography variant='body2' color='primary'>
                Processing transactions...
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
              <Typography variant='h6' color='success.main' gutterBottom>
                Upload Complete!
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:file-text' color='primary' />
                  </ListItemIcon>
                  <ListItemText primary='Total Rows' secondary={stats.totalRows?.toLocaleString() || '0'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:check' color='success' />
                  </ListItemIcon>
                  <ListItemText primary='Created' secondary={stats.processedRows?.toLocaleString() || '0'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:users' color='info' />
                  </ListItemIcon>
                  <ListItemText primary='New Agents' secondary={stats.newAgents?.toLocaleString() || '0'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='tabler:receipt' color='warning' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Transactions Added'
                    secondary={stats.newTransactions?.toLocaleString() || '0'}
                  />
                </ListItem>
              </List>
              {stats.errors && stats.errors.length > 0 && (
                <Alert severity='warning' sx={{ mt: 4 }}>
                  <Typography variant='h6' gutterBottom>
                    {stats.errors.length} errors
                  </Typography>
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

TransactionUpload.acl = {
  action: 'create',
  subject: 'transactions'
}

export default TransactionUpload
