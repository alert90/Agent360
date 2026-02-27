import type { NextApiRequest, NextApiResponse } from 'next/types'
import { PapaParseStreamingService } from '../../../services/papaParseStreamingService'
import * as fs from 'fs'
import { IncomingForm } from 'formidable'

// Disable body parsing for file upload
export const config = {
  api: {
    bodyParser: false
  }
}

const uploadDir = './uploads'
const papaService = new PapaParseStreamingService()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Parse form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024 // 100MB
    })

    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = files.file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const filePath = file.filepath

    // Set up progress tracking
    papaService.on('progress', progress => {
      // We could use WebSocket or Server-Sent Events for real-time updates
      console.log('Upload progress:', progress)
    })

    papaService.on('complete', result => {
      console.log('Upload complete:', result)
    })

    papaService.on('error', error => {
      console.error('Upload error:', error)
    })

    // Start streaming upload
    const result = await papaService.streamUploadCSV(filePath, {
      batchSize: 1000 // Process 1000 rows at a time
    })

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.warn('Failed to cleanup uploaded file:', error)
    }

    return res.status(200).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: result
    })
  } catch (error) {
    console.error('Stream upload error:', error)

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    })
  }
}
