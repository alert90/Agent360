import React, { useState, useCallback, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { Box, Button, Typography, LinearProgress, Alert, Card, CardContent, Chip } from '@mui/material'
import Icon from 'src/@core/components/icon'

interface UploadProgress {
  stage: 'parsing' | 'uploading' | 'completed' | 'error'
  progress: number
  bytesUploaded: number
  totalBytes: number
  chunksUploaded: number
  totalChunks: number
  processingRate: number
  estimatedTimeRemaining: number
  errors: string[]
}

interface UploadResult {
  success: boolean
  message: string
  fileId?: string
  stats?: {
    total?: number
    created?: number
    skipped?: number
    newAgents?: number
    processingTime?: number
  }
  errors?: Array<{ transaction: string; error: string }>
}

const CHUNK_SIZE = 800 * 1024
const BATCH_SIZE = 1000

interface StreamingFileUploadProps {
  onUploadStart?: () => void
  onUploadComplete?: (result: UploadResult) => void
  onUploadProgress?: (progress: number) => void
  onError?: (error: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number
  autoStart?: boolean
}

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date()

  try {
    // Handle format like "01/10/2025 0:00" or "01/10/2025 10:30"
    const parts = dateStr.split(' ')
    const datePart = parts[0]

    if (datePart.includes('/')) {
      const dateParts = datePart.split('/')
      if (dateParts.length === 3) {
        // parts[0] = day, parts[1] = month, parts[2] = year
        const day = parseInt(dateParts[0], 10)
        const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed in JS
        const year = parseInt(dateParts[2], 10)

        // Check if there's time part
        if (parts.length > 1) {
          const timePart = parts[1]
          if (timePart.includes(':')) {
            const timeParts = timePart.split(':')
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0], 10)
              const minutes = parseInt(timeParts[1], 10)

              return new Date(year, month, day, hours, minutes)
            }
          }
        }

        return new Date(year, month, day)
      }
    }

    // Fallback to default parsing
    const fallbackDate = new Date(dateStr)

    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate
  } catch (error) {
    console.error('Error parsing date:', dateStr, error)

    return new Date()
  }
}

const StreamingFileUpload: React.FC<StreamingFileUploadProps> = ({
  onUploadStart,
  onUploadComplete,
  onUploadProgress,
  onError,
  acceptedFileTypes = ['.csv'],
  maxFileSize = 500 * 1024 * 1024, // 500MB default
  autoStart = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string>('')
  const [parsedTransactions, setParsedTransactions] = useState<any[] | null>(null)

  // Auto-start upload when file is selected if autoStart is true
  useEffect(() => {
    if (selectedFile && autoStart && !isUploading && !uploadResult) {
      handleUpload()
    }
  }, [selectedFile, autoStart, isUploading, uploadResult])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`)

        return
      }

      if (file.size > maxFileSize) {
        setError(`File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`)

        return
      }

      setSelectedFile(file)
      setError('')
      setUploadResult(null)
      setUploadProgress(null)
      setParsedTransactions(null)
    },
    [acceptedFileTypes, maxFileSize]
  )

  const formatCustomerAccount = (account: string): string => {
    if (!account) return ''
    if (account.includes('E+')) {
      try {
        const num = parseFloat(account)
        if (!isNaN(num)) {
          return num.toFixed(0)
        }
      } catch (e) {
        // ignore
      }
    }

    return account
  }

  const determineTransactionType = (narration: string, amountDebit: string, amountCredit: string): string => {
    const lowerNarration = narration.toLowerCase()
    const hasDebit = amountDebit && parseFloat(amountDebit.replace(/,/g, '')) > 0
    const hasCredit = amountCredit && parseFloat(amountCredit.replace(/,/g, '')) > 0

    // Keywords for deposits (English & Swahili)
    if (
      lowerNarration.includes('deposit') ||
      lowerNarration.includes('kuweka') ||
      lowerNarration.includes('malipo') ||
      lowerNarration.includes('dep') ||
      lowerNarration.includes('dp') ||
      lowerNarration.includes('depost') ||
      lowerNarration.includes('weka') ||
      lowerNarration.includes('sav') ||
      lowerNarration.includes('akiba') ||
      lowerNarration.includes('aki')
    ) {
      return 'deposit'
    }

    // Keywords for withdrawals
    if (
      lowerNarration.includes('withdrawal') ||
      lowerNarration.includes('kutoa') ||
      lowerNarration.includes('withdraw') ||
      lowerNarration.includes('draw') ||
      lowerNarration.includes('toa')
    ) {
      return 'withdrawal'
    }

    // keyword for transfer
    if (
      lowerNarration.includes('transfer') ||
      lowerNarration.includes('kutuma') ||
      lowerNarration.includes('tuma') ||
      lowerNarration.includes('trans')
    ) {
      return 'transfer'
    }

    // keyword for payments
    if (
      lowerNarration.includes('malipo') ||
      lowerNarration.includes('lip') ||
      lowerNarration.includes('payment') ||
      lowerNarration.includes('ada') ||
      lowerNarration.includes('fees')
    ) {
      return 'payment'
    }

    // Fallback to column-based detection
    if (hasDebit) return 'deposit'
    if (hasCredit) return 'withdraw'

    return 'transfer'
  }

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const startTime = Date.now()

      try {
        // Stage 1: Parsing
        setUploadProgress({
          stage: 'parsing',
          progress: 5,
          bytesUploaded: 0,
          totalBytes: file.size,
          chunksUploaded: 0,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          processingRate: 0,
          estimatedTimeRemaining: 0,
          errors: []
        })
        onUploadProgress?.(5)

        // Parse CSV
        const fileContent = await file.text()

        setUploadProgress(prev => (prev ? { ...prev, progress: 15 } : null))
        onUploadProgress?.(15)

        const parseResult = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim().toUpperCase(),
          transform: value => value?.toString().trim() || ''
        })

        if (!parseResult.data || parseResult.data.length === 0) {
          throw new Error('No data found in CSV file')
        }

        setUploadProgress(prev => (prev ? { ...prev, progress: 25 } : null))
        onUploadProgress?.(25)

        // Convert to transactions with proper date parsing
        const transactions = parseResult.data
          .map((row: any, index: number) => {
            const narration = row.NARRATION || ''
            const refMatch = narration.match(/REF:([a-f0-9]+)/i)
            const transactionId = refMatch ? refMatch[1] : `TXN_${Date.now()}_${index}`

            const amountDebit = row.AMOUNTDEBIT || '0'
            const amountCredit = row.AMOUNTCREDIT || '0'

            // Determine amount
            let amount = 0
            if (amountDebit && parseFloat(amountDebit.replace(/,/g, '')) > 0) {
              amount = parseFloat(amountDebit.replace(/,/g, ''))
            } else if (amountCredit && parseFloat(amountCredit.replace(/,/g, '')) > 0) {
              amount = parseFloat(amountCredit.replace(/,/g, ''))
            }

            const type = determineTransactionType(narration, amountDebit, amountCredit)

            // Parse the date correctly (DD/MM/YYYY format)
            const parsedDate = parseDate(row.TRXDATE || '')

            return {
              id: transactionId,
              agentName: row.AGENTSNAME || '',
              agentId: row.AGNTACCNT || '',
              branchCode: row.BRC || '',
              branchName: row.BRCHNAME || '',
              customerName: row.CSTMNAME || 'Unknown Customer',
              customerAccount: formatCustomerAccount(row.CSTMACCNT || ''),
              amount: amount,
              narration: narration,
              channel: row.CHANNEL || 'AGENCY',
              timestamp: parsedDate.toISOString(),
              type: type
            }
          })
          .filter(t => t.agentId && t.agentName && t.amount > 0)

        if (transactions.length === 0) {
          throw new Error('No valid transactions found in CSV')
        }

        setParsedTransactions(transactions)

        // Stage 2: Uploading
        setUploadProgress({
          stage: 'uploading',
          progress: 30,
          bytesUploaded: file.size,
          totalBytes: file.size,
          chunksUploaded: Math.ceil(file.size / CHUNK_SIZE),
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          processingRate: 0,
          estimatedTimeRemaining: 0,
          errors: []
        })
        onUploadProgress?.(30)

        // Send in reasonably sized batches
        let totalCreated = 0
        let totalSkipped = 0
        let totalNewAgents = 0
        const allErrors: Array<{ transaction: string; error: string }> = []

        const totalBatches = Math.ceil(transactions.length / BATCH_SIZE)

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE
          const batch = transactions.slice(start, start + BATCH_SIZE)

          console.log(`Sending batch ${batchIndex + 1}/${totalBatches} with ${batch.length} transactions`)

          const response = await fetch('/api/transactions/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactions: batch })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Batch failed:', errorText)
            throw new Error(`Import failed at batch ${batchIndex + 1}: ${response.status}`)
          }

          const result = await response.json()

          totalCreated += result.stats?.created || 0
          totalSkipped += result.stats?.skipped || 0
          totalNewAgents += result.stats?.newAgents || 0

          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors)
          }

          const progress = 30 + Math.floor(((batchIndex + 1) / totalBatches) * 65)
          setUploadProgress(prev => (prev ? { ...prev, progress } : null))
          onUploadProgress?.(progress)
        }

        // Stage 3: Completed
        setUploadProgress({
          stage: 'completed',
          progress: 100,
          bytesUploaded: file.size,
          totalBytes: file.size,
          chunksUploaded: Math.ceil(file.size / CHUNK_SIZE),
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          processingRate: 0,
          estimatedTimeRemaining: 0,
          errors: allErrors
        })
        onUploadProgress?.(100)

        const processingTime = (Date.now() - startTime) / 1000

        return {
          success: true,
          message: `✅ ${totalCreated} created, ${totalSkipped} skipped`,
          fileId,
          stats: {
            total: transactions.length,
            created: totalCreated,
            skipped: totalSkipped,
            newAgents: totalNewAgents,
            processingTime
          },
          errors: allErrors
        }
      } catch (error) {
        console.error('Upload error:', error)
        throw error
      }
    },
    [onUploadProgress]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    onUploadStart?.()
    setError('')
    setUploadProgress(null)
    setUploadResult(null)

    try {
      const result = await uploadFile(selectedFile)
      setUploadResult(result)
      onUploadComplete?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      console.error('Upload error:', errorMessage)
      setError(errorMessage)
      onError?.(errorMessage)

      setUploadProgress({
        stage: 'error',
        progress: 0,
        bytesUploaded: 0,
        totalBytes: selectedFile.size,
        chunksUploaded: 0,
        totalChunks: Math.ceil(selectedFile.size / CHUNK_SIZE),
        processingRate: 0,
        estimatedTimeRemaining: 0,
        errors: [errorMessage]
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, uploadFile, onUploadStart, onUploadComplete, onError])

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setSelectedFile(null)
    setError('')
    setUploadResult(null)
    setUploadProgress(null)
    setParsedTransactions(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'success'
      case 'parsing':
        return 'info'
      case 'uploading':
        return 'primary'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStageMessage = (stage: string, progress: number) => {
    if (stage === 'parsing') return 'Parsing CSV file...'
    if (stage === 'uploading') {
      if (progress < 50) return 'Uploading transactions...'
      if (progress < 80) return 'Processing transactions...'

      return 'Finalizing...'
    }
    if (stage === 'completed') return 'Upload complete!'
    if (stage === 'error') return 'Upload failed'

    return 'Processing...'
  }

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* File selection area */}
      {!selectedFile && !isUploading && !uploadResult && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            bgcolor: 'grey.50',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'grey.100'
            }
          }}
          onClick={handleBrowseClick}
        >
          <Icon icon='tabler:upload' fontSize={48} color='action' />
          <Typography variant='h6' sx={{ mt: 2 }}>
            Click to browse or drag and drop
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Supported formats: {acceptedFileTypes.join(', ')} (Max: {formatFileSize(maxFileSize)})
          </Typography>
        </Box>
      )}

      {/* Selected file info */}
      {selectedFile && !isUploading && !uploadResult && !error && (
        <Card variant='outlined'>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon icon='tabler:file-text' fontSize={32} color='primary' />
                <Box>
                  <Typography variant='subtitle1'>{selectedFile.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='outlined'
                  color='secondary'
                  size='small'
                  onClick={handleReset}
                  startIcon={<Icon icon='tabler:x' />}
                >
                  Cancel
                </Button>
                {!autoStart && (
                  <Button
                    variant='contained'
                    size='small'
                    onClick={handleUpload}
                    disabled={isUploading}
                    startIcon={<Icon icon='tabler:upload' />}
                  >
                    Upload Now
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Alert
          severity='error'
          sx={{ mt: 2 }}
          action={
            <Button color='inherit' size='small' onClick={handleReset}>
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <Box sx={{ mt: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Icon
                  icon={
                    uploadProgress.stage === 'completed'
                      ? 'tabler:check-circle'
                      : uploadProgress.stage === 'error'
                      ? 'tabler:alert-circle'
                      : 'tabler:cloud-upload'
                  }
                  fontSize={32}
                  color={
                    uploadProgress.stage === 'completed'
                      ? 'success'
                      : uploadProgress.stage === 'error'
                      ? 'error'
                      : 'primary'
                  }
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant='subtitle1'>
                    {getStageMessage(uploadProgress.stage, uploadProgress.progress)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {uploadProgress.stage === 'parsing' && 'Reading and validating CSV data...'}
                    {uploadProgress.stage === 'uploading' &&
                      `Processing batch ${Math.floor(
                        (uploadProgress.progress / 100) * (uploadProgress.totalChunks || 1)
                      )} of ${uploadProgress.totalChunks || 1}`}
                    {uploadProgress.stage === 'completed' && 'All transactions have been processed'}
                  </Typography>
                </Box>
                <Chip
                  label={`${Math.round(uploadProgress.progress)}%`}
                  size='small'
                  color={getStageColor(uploadProgress.stage) as any}
                />
              </Box>

              <LinearProgress
                variant='determinate'
                value={uploadProgress.progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4
                  }
                }}
              />

              {uploadProgress.stage === 'uploading' && parsedTransactions && (
                <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='h6' color='primary'>
                      {parsedTransactions.length.toLocaleString()}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Total Transactions
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='h6' color='success.main'>
                      {Math.round(((uploadProgress.progress - 30) / 65) * 100)}%
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Upload Progress
                    </Typography>
                  </Box>
                </Box>
              )}

              {uploadProgress.errors && uploadProgress.errors.length > 0 && (
                <Alert severity='warning' sx={{ mt: 2 }}>
                  <Typography variant='subtitle2'>Errors encountered:</Typography>
                  {uploadProgress.errors.slice(0, 3).map((err, idx) => (
                    <Typography key={idx} variant='caption' display='block'>
                      • {err}
                    </Typography>
                  ))}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default StreamingFileUpload
