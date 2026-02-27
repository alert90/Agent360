// ** React Imports
import { Fragment, useState, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import { styled, useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Components
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

// ** Services
import csvImportService from '../services/csvImportService'

// ** Types
import { TransactionType } from '../types/apps/transactionsTypes'

interface FileProp {
  name: string
  type: string
  size: number
}

interface CSVImportProps {
  onImportComplete: (transactions: TransactionType[]) => void
  onError: (errors: string[]) => void
}

const StyledDropzone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(8),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  },
  '&.active': {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`
  }
}))

const CSVImport: React.FC<CSVImportProps> = ({ onImportComplete, onError }) => {
  // ** State
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  // ** Hooks
  const theme = useTheme()

  const handleImport = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setErrors([])
      setSuccess(false)
      setUploadProgress(0)

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)

              return 90
            }

            return prev + 10
          })
        }, 100)

        const result = await csvImportService.importCSV(file)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (result.success && result.data) {
          setSuccess(true)
          onImportComplete(result.data)
          toast.success('CSV file imported successfully!', {
            duration: 3000
          })
          setTimeout(() => {
            setSuccess(false)
            setIsUploading(false)
            setUploadProgress(0)
            setFiles([])
          }, 2000)
        } else {
          setErrors(result.errors || ['Unknown error occurred'])
          onError(result.errors || ['Unknown error occurred'])
          setIsUploading(false)
          setUploadProgress(0)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to import CSV'
        setErrors([errorMessage])
        onError([errorMessage])
        setIsUploading(false)
        setUploadProgress(0)
        toast.error(errorMessage, {
          duration: 3000
        })
      }
    },
    [onImportComplete, onError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB to handle large files like 69MB
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles.map((file: File) => Object.assign(file)))

        // Auto-import single file
        if (acceptedFiles.length === 1) {
          handleImport(acceptedFiles[0])
        }
      }
    },
    onDropRejected: fileRejections => {
      const rejection = fileRejections[0]
      if (rejection) {
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          toast.error('File size must be less than 100MB', {
            duration: 3000
          })
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          toast.error('Please upload a CSV file', {
            duration: 3000
          })
        } else {
          toast.error('Please check your file and try again', {
            duration: 3000
          })
        }
      }
    }
  })

  const handleRemoveFile = (file: FileProp) => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter((i: FileProp) => i.name !== file.name)
    setFiles([...filtered])
    setErrors([])
    setSuccess(false)
  }

  const handleRemoveAllFiles = () => {
    setFiles([])
    setErrors([])
    setSuccess(false)
  }

  const fileList = files.map((file: FileProp) => (
    <ListItem key={file.name} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Box sx={{ mr: 3 }}>
          <Icon icon='tabler:file-description' fontSize={24} color={theme.palette.text.secondary} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {file.name}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} MB`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} KB`}
          </Typography>
        </Box>
      </Box>
      <IconButton onClick={() => handleRemoveFile(file)} size='small'>
        <Icon icon='tabler:x' fontSize={20} />
      </IconButton>
    </ListItem>
  ))

  return (
    <Fragment>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant='h6' sx={{ mb: 4 }}>
            Import Commission Data (CSV)
          </Typography>

          <StyledDropzone {...getRootProps()} className={isDragActive ? 'active' : ''}>
            <input {...getInputProps()} />
            <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <Box
                sx={{
                  mb: 3,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  borderRadius: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `rgba(${theme.palette.customColors.main}, 0.08)`
                }}
              >
                <Icon icon='tabler:upload' fontSize='1.75rem' />
              </Box>
              <Typography variant='h6' sx={{ mb: 2 }}>
                {isDragActive ? 'Drop CSV file here' : 'Drop CSV file here or click to browse'}
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                Supported format: CSV files with transaction data
              </Typography>
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                Maximum file size: 100MB
              </Typography>
            </Box>
          </StyledDropzone>

          {files.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                Selected Files
              </Typography>
              <List sx={{ p: 0 }}>{fileList}</List>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button color='error' variant='outlined' onClick={handleRemoveAllFiles} disabled={isUploading}>
                  Remove All
                </Button>
                {files.length === 1 && (
                  <Button
                    variant='contained'
                    onClick={() => handleImport(files[0])}
                    disabled={isUploading}
                    startIcon={
                      isUploading ? <Icon icon='tabler:loader-2' className='rotate' /> : <Icon icon='tabler:upload' />
                    }
                  >
                    {isUploading ? 'Importing...' : 'Import CSV'}
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {isUploading && (
            <Box sx={{ mt: 4 }}>
              <Typography variant='body2' sx={{ mb: 1 }}>
                Importing CSV file... {uploadProgress}%
              </Typography>
              <LinearProgress variant='determinate' value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}

          {errors.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant='subtitle1' sx={{ mb: 2, color: 'error.main' }}>
                Import Errors
              </Typography>
              {errors.map((error, index) => (
                <Alert key={index} severity='error' sx={{ mb: 1 }}>
                  {error}
                </Alert>
              ))}
            </Box>
          )}

          {success && (
            <Box sx={{ mt: 4 }}>
              <Alert severity='success'>
                CSV file imported successfully! Commission calculations have been updated.
              </Alert>
            </Box>
          )}

          <Box sx={{ mt: 4, p: 3, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
              CSV File Requirements:
            </Typography>
            <Typography variant='body2' component='div'>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>File must be in CSV format</li>
                <li>
                  Required columns: TRANSACTIONID, AGENTSNAME, BRC, TRXDATE, AGNTACCNT, NARRATION, AMOUNTDEBIT,
                  AMOUNTCREDIT, CSTMACCNT, CSTMNAME, CHANNEL, BRCHNAME
                </li>
                <li>Agent accounts must start with "01J7"</li>
                <li>Date format: DD/MM/YYYY HH:mm</li>
                <li>Amount fields should contain numeric values or "N/A"</li>
              </ul>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Fragment>
  )
}

export default CSVImport
