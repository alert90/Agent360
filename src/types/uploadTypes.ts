export interface UploadProgress {
  stage: 'initializing' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  bytesUploaded: number
  totalBytes: number
  chunksUploaded: number
  totalChunks: number
  processingRate: number // bytes per second
  estimatedTimeRemaining: number // seconds
  errors: string[]
}

export interface UploadResult {
  success: boolean
  message: string
  fileId?: string
  stats?: {
    processedRows?: number
    processingTime?: number
    fileSize?: number
    chunksProcessed?: number
  }
  errors?: string[]
}

export interface PaginatedData {
  data: any[]
  headers: string[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary?: {
    totalRows: number
    columns: number
    fileSize: string
  }
}
