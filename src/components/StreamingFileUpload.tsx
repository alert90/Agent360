import React, { useState, useCallback, useRef } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { UploadProgress, UploadResult, PaginatedData } from 'src/types/uploadTypes'

const CHUNK_SIZE = 800 * 1024 // 800KB chunks to stay under 1MB limit with multipart overhead
const ROWS_PER_PAGE = 100

interface StreamingFileUploadProps {
  onUploadComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
}

const StreamingFileUpload: React.FC<StreamingFileUploadProps> = ({
  onUploadComplete,
  onError,
  acceptedFileTypes = ['.csv', '.txt'],
  maxFileSize = 1024 * 1024 * 1024 // 1GB default for large files
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string>('')
  const [previewData, setPreviewData] = useState<PaginatedData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`)

        return
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(`File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`)

        return
      }

      setSelectedFile(file)
      setError('')
      setUploadResult(null)
      setUploadProgress(null)
    },
    [acceptedFileTypes, maxFileSize]
  )

  const uploadFileInChunks = useCallback(async (file: File): Promise<UploadResult> => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    let uploadedChunks = 0
    let totalBytesUploaded = 0
    const startTime = Date.now()

    try {
      // Initialize upload
      setUploadProgress({
        stage: 'initializing',
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size,
        chunksUploaded: 0,
        totalChunks,
        processingRate: 0,
        estimatedTimeRemaining: 0,
        errors: []
      })

      // Upload chunks using streaming API (bypasses body size limit)
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        // Convert chunk to ArrayBuffer for streaming
        const arrayBuffer = await chunk.arrayBuffer()

        const chunkResponse = await fetch('/api/files/stream-upload-large', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'file-id': fileId,
            'file-name': file.name,
            'file-size': file.size.toString(),
            'chunk-index': chunkIndex.toString(),
            'total-chunks': totalChunks.toString(),
            'upload-id': uploadId
          },
          body: arrayBuffer
        })

        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text()
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}: ${errorText}`)
        }

        const chunkResult = await chunkResponse.json()
        uploadedChunks++
        totalBytesUploaded += chunk.size

        // Calculate real-time progress
        const elapsedTime = (Date.now() - startTime) / 1000
        const processingRate = totalBytesUploaded / elapsedTime
        const estimatedTimeRemaining = processingRate > 0 ? (file.size - totalBytesUploaded) / processingRate : 0

        const progress: UploadProgress = {
          stage: 'uploading',
          progress: chunkResult.progress || (uploadedChunks / totalChunks) * 100,
          bytesUploaded: totalBytesUploaded,
          totalBytes: file.size,
          chunksUploaded: uploadedChunks,
          totalChunks,
          processingRate,
          estimatedTimeRemaining,
          errors: []
        }

        setUploadProgress(progress)

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Set processing stage
      setUploadProgress({
        stage: 'processing',
        progress: 95,
        bytesUploaded: file.size,
        totalBytes: file.size,
        chunksUploaded: totalChunks,
        totalChunks,
        processingRate: 0,
        estimatedTimeRemaining: 0,
        errors: []
      })

      // The last chunk already triggers processing, so we just need to wait and return
      const result: UploadResult = {
        success: true,
        message: 'File uploaded successfully and processing started',
        fileId,
        stats: {
          processedRows: 0, // Will be updated by background process
          processingTime: 0
        }
      }

      return result
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')
    setUploadProgress(null)
    setUploadResult(null)

    try {
      const result = await uploadFileInChunks(selectedFile)
      setUploadResult(result)
      setUploadProgress({
        stage: 'completed',
        progress: 100,
        bytesUploaded: selectedFile.size,
        totalBytes: selectedFile.size,
        chunksUploaded: Math.ceil(selectedFile.size / CHUNK_SIZE),
        totalChunks: Math.ceil(selectedFile.size / CHUNK_SIZE),
        processingRate: 0,
        estimatedTimeRemaining: 0,
        errors: []
      })
      onUploadComplete?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, uploadFileInChunks, onUploadComplete, onError])

  const loadPreviewData = useCallback(
    async (page = 1, search = '') => {
      if (!uploadResult?.fileId) return

      try {
        const response = await fetch(
          `/api/files/preview-data?fileId=${
            uploadResult.fileId
          }&page=${page}&limit=${ROWS_PER_PAGE}&search=${encodeURIComponent(search)}`
        )
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to load preview data: ${errorText}`)
        }

        const data: PaginatedData = await response.json()
        setPreviewData(data)
      } catch (error) {
        console.error('Failed to load preview data:', error)
      }
    },
    [uploadResult]
  )

  const handlePageChange = useCallback(
    (event: React.ChangeEvent<unknown>, value: number) => {
      setCurrentPage(value)
      loadPreviewData(value, searchQuery)
    },
    [loadPreviewData, searchQuery]
  )

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value
      setSearchQuery(query)
      setCurrentPage(1)
      loadPreviewData(1, query)
    },
    [loadPreviewData]
  )

  const showPreview = useCallback(() => {
    if (uploadResult?.success) {
      setShowPreviewDialog(true)
      loadPreviewData(1, '')
    }
  }, [uploadResult, loadPreviewData])

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
      case 'initializing':
        return 'info'
      case 'uploading':
        return 'primary'
      case 'processing':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {uploadResult && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setUploadResult(null)}>
          <Typography variant='subtitle2'>{uploadResult.message}</Typography>
          {uploadResult.stats && (
            <Box sx={{ mt: 1 }}>
              <Typography variant='body2'>
                Rows processed: {uploadResult.stats.processedRows?.toLocaleString()}
              </Typography>
              <Typography variant='body2'>Processing time: {uploadResult.stats.processingTime?.toFixed(2)}s</Typography>
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Upload Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                File Upload
              </Typography>

              <input
                ref={fileInputRef}
                type='file'
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label='Selected File'
                  value={selectedFile?.name || ''}
                  placeholder='No file selected'
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          color='primary'
                        >
                          <Icon icon='tabler:folder-open' />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {selectedFile && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    File size: {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant='contained'
                  startIcon={<Icon icon='tabler:upload' />}
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  fullWidth
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>

                {uploadResult?.success && (
                  <Button variant='outlined' startIcon={<Icon icon='tabler:eye' />} onClick={showPreview}>
                    Preview
                  </Button>
                )}
              </Box>

              {uploadProgress && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' gutterBottom>
                    <strong>Stage:</strong> {uploadProgress.stage}
                    <Chip
                      label={`${uploadProgress.progress.toFixed(1)}%`}
                      size='small'
                      color={getStageColor(uploadProgress.stage) as any}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <LinearProgress variant='determinate' value={uploadProgress.progress} sx={{ mb: 1 }} />
                  <Typography variant='caption' color='text.secondary'>
                    {uploadProgress.chunksUploaded} / {uploadProgress.totalChunks} chunks
                    {uploadProgress.processingRate > 0 && (
                      <> • {(uploadProgress.processingRate / 1024 / 1024).toFixed(2)} MB/s</>
                    )}
                    {uploadProgress.estimatedTimeRemaining > 0 && (
                      <> • ETA: {formatTime(uploadProgress.estimatedTimeRemaining)}</>
                    )}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block'>
                    {formatFileSize(uploadProgress.bytesUploaded)} / {formatFileSize(uploadProgress.totalBytes)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* File Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Upload Settings
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Chunk Size: {formatFileSize(CHUNK_SIZE)}
                </Typography>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Max File Size: {formatFileSize(maxFileSize)}
                </Typography>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Accepted Types: {acceptedFileTypes.join(', ')}
                </Typography>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Preview Rows: {ROWS_PER_PAGE} per page
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth='lg' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='h6'>Data Preview</Typography>
            <IconButton onClick={() => setShowPreviewDialog(false)}>
              <Icon icon='tabler:x' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {previewData && (
            <Box>
              {/* Search */}
              <TextField
                fullWidth
                label='Search'
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='tabler:search' />
                    </InputAdornment>
                  )
                }}
              />

              {/* Summary */}
              {previewData.summary && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Total Rows: {previewData.summary.totalRows?.toLocaleString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Columns: {previewData.summary.columns}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    File Size: {previewData.summary.fileSize}
                  </Typography>
                </Box>
              )}

              {/* Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size='small'>
                  <TableHead>
                    <TableRow>
                      {previewData.headers.map((header, index) => (
                        <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {previewData.headers.map((header, colIndex) => (
                          <TableCell key={colIndex}>{row[header] || ''}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {previewData.pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={previewData.pagination.totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color='primary'
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StreamingFileUpload
