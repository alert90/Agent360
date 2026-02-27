import { NextApiRequest, NextApiResponse } from 'next/types'
import { csvImportService } from '../../../services/csvImportService'
import { UploadResult } from '../../../types/uploadTypes'
import * as fs from 'fs'
import * as path from 'path'
import formidable from 'formidable'

// Global upload sessions storage (in production, use Redis or database)
const uploadSessions = new Map<
  string,
  {
    fileId: string
    fileName: string
    fileSize: number
    totalChunks: number
    uploadedChunks: Set<number>
    filePath: string
    createdAt: Date
  }
>()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleChunkUpload(req, res)
  } else {
    res.setHeader('Allow', ['POST'])

    return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function handleChunkUpload(req: NextApiRequest, res: NextApiResponse) {
  try {
    const contentType = req.headers['content-type']

    if (contentType && contentType.includes('multipart/form-data')) {
      return handleFormDataUpload(req, res)
    } else {
      // Handle JSON action requests
      const { action } = req.body

      switch (action) {
        case 'start':
          return handleStartUpload(req, res)
        case 'complete':
          return handleCompleteUpload(req, res)
        default:
          return res.status(400).json({ message: 'Invalid action' })
      }
    }
  } catch (error) {
    console.error('Chunk upload error:', error)

    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleFormDataUpload(req: NextApiRequest, res: NextApiResponse) {
  try {
    const form = formidable({ multiples: false })
    const [fields, files] = await form.parse(req)

    const { uploadId, chunkIndex } = fields as { uploadId?: string; chunkIndex?: string }
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!uploadId || chunkIndex === undefined || !file) {
      return res.status(400).json({ message: 'Missing chunk upload parameters' })
    }

    const session = uploadSessions.get(uploadId as string)
    if (!session) {
      return res.status(404).json({ message: 'Upload session not found' })
    }

    // Check if this chunk was already uploaded
    const chunkNum = parseInt(chunkIndex!)
    if (session.uploadedChunks.has(chunkNum)) {
      console.log(`Chunk ${chunkNum + 1} already uploaded, skipping...`)

      return res.status(200).json({
        message: 'Chunk already uploaded',
        chunkIndex: chunkNum,
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks
      })
    }

    // Read chunk data
    const chunkData = fs.readFileSync(file.filepath)

    try {
      // Calculate chunk position in file
      const chunkSize = Math.ceil(session.fileSize / session.totalChunks)
      const position = chunkNum * chunkSize

      // Write chunk to temporary file
      const fileDescriptor = fs.openSync(session.filePath, 'r+')
      fs.writeSync(fileDescriptor, new Uint8Array(chunkData), 0, chunkData.length, position)
      fs.closeSync(fileDescriptor)

      // Track uploaded chunk
      session.uploadedChunks.add(chunkNum)

      console.log(
        `Uploaded chunk ${chunkNum + 1}/${session.totalChunks} for session: ${uploadId} (${(
          (session.uploadedChunks.size / session.totalChunks) *
          100
        ).toFixed(1)}%)`
      )

      // Clean up temporary chunk file
      fs.unlinkSync(file.filepath)

      return res.status(200).json({
        message: 'Chunk uploaded successfully',
        chunkIndex: chunkNum,
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks,
        progress: (session.uploadedChunks.size / session.totalChunks) * 100
      })
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}:`, error)

      return res.status(500).json({
        message: 'Failed to upload chunk',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('FormData parsing error:', error)

    return res.status(500).json({
      message: 'Failed to parse form data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleStartUpload(req: NextApiRequest, res: NextApiResponse) {
  const { fileId, fileName, fileSize, totalChunks } = req.body

  if (!fileId || !fileName || !fileSize || !totalChunks) {
    return res.status(400).json({ message: 'Missing required upload parameters' })
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'temp')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // Create temporary file path
  const tempFilePath = path.join(uploadsDir, `${fileId}.tmp`)

  // Generate unique upload ID
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Initialize upload session
  const uploadSession = {
    fileId,
    fileName,
    fileSize,
    totalChunks,
    uploadedChunks: new Set<number>(),
    filePath: tempFilePath,
    createdAt: new Date()
  }

  uploadSessions.set(uploadId, uploadSession)

  // Create empty file
  fs.writeFileSync(tempFilePath, '')

  console.log(`Started upload session: ${uploadId} for file: ${fileName}`)

  return res.status(200).json({
    uploadId,
    message: 'Upload session started successfully'
  })
}

async function handleCompleteUpload(req: NextApiRequest, res: NextApiResponse) {
  const { uploadId, fileId } = req.body

  if (!uploadId || !fileId) {
    return res.status(400).json({ message: 'Missing completion parameters' })
  }

  const session = uploadSessions.get(uploadId)
  if (!session) {
    return res.status(404).json({ message: 'Upload session not found' })
  }

  // Verify all chunks are uploaded
  if (session.uploadedChunks.size !== session.totalChunks) {
    return res.status(400).json({
      message: 'Not all chunks uploaded',
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks
    })
  }

  try {
    // Move temporary file to final location
    const finalDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true })
    }

    const finalFilePath = path.join(finalDir, session.fileName)
    fs.renameSync(session.filePath, finalFilePath)

    // Clean up session
    uploadSessions.delete(uploadId)

    console.log(`Completed upload: ${session.fileName} -> ${finalFilePath}`)

    // Start processing: file with our unified service
    processFileInBackground(finalFilePath, fileId)

    const result: UploadResult = {
      success: true,
      message: 'File uploaded successfully and processing started',
      fileId,
      stats: {
        processedRows: 0, // Will be updated by background process
        processingTime: 0
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error completing upload:', error)

    return res.status(500).json({
      message: 'Failed to complete upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function processFileInBackground(filePath: string, fileId: string) {
  try {
    console.log(`Starting background processing for: ${filePath}`)

    // Read file and create a File object for the CSV service
    const fileBuffer = fs.readFileSync(filePath)
    const file = new File([new Uint8Array(fileBuffer)], path.basename(filePath), { type: 'text/csv' })

    // Use our unified CSV import service
    const result = await csvImportService.importCSV(file)

    console.log(`Background processing completed for: ${filePath}`, result)

    // Store result for preview API
    const previewData = {
      fileId,
      filePath,
      result,
      processedAt: new Date()
    }

    // Store in memory for demo purposes
    ;(global as any).processedFiles = (global as any).processedFiles || new Map()
    ;(global as any).processedFiles.set(fileId, previewData)
  } catch (error) {
    console.error(`Background processing failed for: ${filePath}`, error)
  }
}

// Cleanup old upload sessions (run periodically)
setInterval(() => {
  const now = new Date()
  const maxAge = 30 * 60 * 1000 // 30 minutes

  for (const [uploadId, session] of uploadSessions) {
    if (now.getTime() - session.createdAt.getTime() > maxAge) {
      // Clean up expired sessions
      try {
        if (fs.existsSync(session.filePath)) {
          fs.unlinkSync(session.filePath)
        }
        uploadSessions.delete(uploadId)
        console.log(`Cleaned up expired upload session: ${uploadId}`)
      } catch (error) {
        console.error(`Error cleaning up session ${uploadId}:`, error)
      }
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes
