// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import TextField from '@mui/material/TextField'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import toast from 'react-hot-toast'

interface UploadedFile {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transactionCount?: number
  calculationPeriod?: string
  errorMessage?: string
}

const CommissionFileManagement = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [calculationPeriod, setCalculationPeriod] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchUploadedFiles()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('/api/files/uploaded')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('File uploaded successfully!')
        fetchUploadedFiles()
      } else {
        toast.error('Failed to upload file')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateCommissions = async (fileId: string) => {
    if (!calculationPeriod) {
      toast.error('Please select a calculation period')

      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/commissions/calculate-from-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: calculationPeriod,
          forceRecalculation: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Commission calculation completed! Processed ${result.summary?.total_agents || 0} agents`)
        fetchUploadedFiles()
      } else {
        const errorData = await response.json()
        toast.error(`Calculation failed: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Calculation failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Commission File Management'
            subheader='Upload CSV files and calculate commissions on demand'
          />
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Upload New File
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant='contained'
                  component='label'
                  startIcon={<Icon icon='tabler:upload' />}
                  disabled={loading}
                >
                  Choose CSV File
                  <input type='file' hidden accept='.csv' onChange={handleFileUpload} />
                </Button>
                {loading && (
                  <Box sx={{ width: 200 }}>
                    <LinearProgress />
                    <Typography variant='caption' sx={{ mt: 1 }}>
                      Uploading...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Alert severity='info' sx={{ mb: 4 }}>
              <Typography variant='body2'>
                Upload CSV files containing transaction data. Once uploaded, you can trigger commission calculations for
                specific periods. The system will automatically process the data and update agent commissions.
              </Typography>
            </Alert>

            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Calculation Settings
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Calculation Period'
                    type='month'
                    value={calculationPeriod}
                    onChange={e => setCalculationPeriod(e.target.value)}
                    helperText='Select the month for commission calculation (YYYY-MM)'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleCalculateCommissions}
                      disabled={loading}
                      startIcon={<Icon icon='tabler:calculator' />}
                      sx={{ minWidth: 200 }}
                    >
                      {loading ? 'Calculating...' : 'Calculate from Sample CSV'}
                    </Button>
                    <Typography variant='caption' color='text.secondary'>
                      Calculate commissions using the sample CSV data
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Typography variant='h6' sx={{ mb: 2 }}>
              Uploaded Files
            </Typography>

            {files.length === 0 ? (
              <Alert severity='warning'>No files uploaded yet. Upload a CSV file to get started.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>File Name</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Transactions</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {files.map(file => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {file.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{formatFileSize(file.size)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{new Date(file.uploadedAt).toLocaleDateString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={file.status} size='small' color={getStatusColor(file.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{file.transactionCount || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size='small'
                              variant='outlined'
                              onClick={() => handleCalculateCommissions()}
                              disabled={loading || file.status === 'processing'}
                              startIcon={<Icon icon='tabler:calculator' />}
                            >
                              Calculate Sample
                            </Button>
                            {file.errorMessage && (
                              <Button size='small' color='error' onClick={() => toast.error(file.errorMessage!)}>
                                View Error
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

CommissionFileManagement.acl = {
  action: 'manage',
  subject: 'commissions'
}

export default CommissionFileManagement
