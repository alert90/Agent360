import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import Icon from 'src/@core/components/icon'

interface ImportProgress {
  stage: 'parsing' | 'validating' | 'processing' | 'calculating' | 'indexing' | 'completed'
  progress: number
  processedRows: number
  totalRows: number
  currentBatch: number
  totalBatches: number
  memoryUsage: number
  processingRate: number
  estimatedTimeRemaining: number
  errors: string[]
}

interface ImportResult {
  success: boolean
  message: string
  result?: any
  performance?: {
    processingTime: number
    averageRate: string
    memoryUsage: any
    cacheHit: boolean
  }
}

interface CacheMetadata {
  fileName: string
  filePath: string
  fileSize: number
  rowCount: number
  checksum: string
  importedAt: string
  lastAccessed: string
  period: string
  status: 'cached' | 'processing' | 'completed' | 'error'
}

const LargeCSVImport: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [cacheData, setCacheData] = useState<CacheMetadata[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Load initial data
  useEffect(() => {
    loadAvailableFiles()
    loadCacheData()
  }, [])

  const loadAvailableFiles = async () => {
    try {
      const response = await fetch('/api/transactions/large-import?action=files')
      const data = await response.json()
      setAvailableFiles(data.availableFiles || [])
    } catch (err) {
      console.error('Failed to load available files:', err)
    }
  }

  const loadCacheData = async () => {
    try {
      const response = await fetch('/api/transactions/large-import?action=cache')
      const data = await response.json()
      setCacheData(data.cache || [])
    } catch (err) {
      console.error('Failed to load cache data:', err)
    }
  }

  const startImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import')

      return
    }

    setIsImporting(true)
    setError('')
    setResult(null)
    setProgress(null)

    try {
      const response = await fetch('/api/transactions/large-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: selectedFile,
          options: {
            chunkSize: 4 * 1024 * 1024, // 4MB
            batchSize: 10000,
            enableCaching: true,
            enableIndexing: true
          },
          period: new Date().toISOString().slice(0, 7),
          calculateCommissions: true
        })
      })

      const data: ImportResult = await response.json()

      if (response.ok) {
        setResult(data)
        await loadCacheData()
        await loadAvailableFiles()
      } else {
        setError(data.message || 'Import failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const checkProgress = async () => {
    try {
      const response = await fetch('/api/transactions/large-import?action=progress')
      const data = await response.json()
      setProgress(data.progress)

      if (data.isProcessing) {
        setTimeout(checkProgress, 2000) // Poll every 2 seconds
      }
    } catch (err) {
      console.error('Failed to check progress:', err)
    }
  }

  const clearCache = async () => {
    try {
      await fetch('/api/transactions/large-import?action=clear', {
        method: 'DELETE'
      })
      await loadCacheData()
    } catch (err) {
      setError('Failed to clear cache')
    }
  }

  const optimizeDatabase = async () => {
    try {
      await fetch('/api/transactions/large-import?action=optimize')
      setError('Database optimized successfully')
    } catch (err) {
      setError('Failed to optimize database')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`

    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'primary'
      case 'calculating':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Large CSV Import System
      </Typography>

      <Typography variant='body1' color='text.secondary' paragraph>
        Import and process large CSV files (299,000+ rows) with streaming, caching, and automatic commission
        calculations.
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setResult(null)}>
          <Typography variant='subtitle2'>{result.message}</Typography>
          {result.performance && (
            <Box sx={{ mt: 1 }}>
              <Typography variant='body2'>Processing Time: {result.performance.processingTime.toFixed(2)}s</Typography>
              <Typography variant='body2'>Average Rate: {result.performance.averageRate} rows/sec</Typography>
              <Typography variant='body2'>Cache Hit: {result.performance.cacheHit ? 'Yes' : 'No'}</Typography>
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Import Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Import Controls
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Select CSV File:
                </Typography>
                <select
                  value={selectedFile}
                  onChange={e => setSelectedFile(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={isImporting}
                >
                  <option value=''>Choose a file...</option>
                  {availableFiles.map(file => (
                    <option key={file} value={file}>
                      {file.split('/').pop()}
                    </option>
                  ))}
                </select>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant='contained'
                  startIcon={<Icon icon='tabler:upload' />}
                  onClick={startImport}
                  disabled={isImporting || !selectedFile}
                  fullWidth
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </Button>

                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:refresh' />}
                  onClick={checkProgress}
                  disabled={isImporting}
                >
                  Check Progress
                </Button>
              </Box>

              {progress && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' gutterBottom>
                    <strong>Stage:</strong> {progress.stage}
                    <Chip
                      label={`${progress.progress.toFixed(1)}%`}
                      size='small'
                      color={getStageColor(progress.stage) as any}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <LinearProgress variant='determinate' value={progress.progress} sx={{ mb: 1 }} />
                  <Typography variant='caption' color='text.secondary'>
                    {progress.processedRows.toLocaleString()} / {progress.totalRows.toLocaleString()} rows
                    {progress.processingRate > 0 && <> • {progress.processingRate.toFixed(0)} rows/sec</>}
                    {progress.estimatedTimeRemaining > 0 && <> • ETA: {formatTime(progress.estimatedTimeRemaining)}</>}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Batch {progress.currentBatch} / {progress.totalBatches} • Memory: {progress.memoryUsage.toFixed(1)}
                    MB
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Cache Management
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:refresh' />}
                  onClick={loadCacheData}
                  size='small'
                >
                  Refresh Cache
                </Button>

                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:trash' />}
                  onClick={clearCache}
                  size='small'
                  color='error'
                >
                  Clear Cache
                </Button>

                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:speed' />}
                  onClick={optimizeDatabase}
                  size='small'
                >
                  Optimize DB
                </Button>
              </Box>

              <Typography variant='body2' color='text.secondary'>
                Cached Files: {cacheData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Details */}
        {cacheData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Cached Files
                </Typography>
                <List>
                  {cacheData.map((cache, index) => (
                    <div key={cache.fileName}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant='body2'>{cache.fileName}</Typography>
                              <Chip
                                label={cache.status}
                                size='small'
                                color={
                                  cache.status === 'completed'
                                    ? 'success'
                                    : cache.status === 'processing'
                                    ? 'warning'
                                    : cache.status === 'error'
                                    ? 'error'
                                    : 'default'
                                }
                                icon={
                                  cache.status === 'completed' ? (
                                    <Icon icon='tabler:circle-check' />
                                  ) : cache.status === 'error' ? (
                                    <Icon icon='tabler:alert-circle' />
                                  ) : (
                                    <Icon icon='tabler:database' />
                                  )
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant='caption' color='text.secondary'>
                              {formatFileSize(cache.fileSize)} • {cache.rowCount.toLocaleString()} rows • Imported:{' '}
                              {new Date(cache.importedAt).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < cacheData.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default LargeCSVImport
