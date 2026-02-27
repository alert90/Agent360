import { NextApiRequest, NextApiResponse } from 'next/types'
import { promises as fs } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const chunks: Buffer[] = []
    const boundary = req.headers['content-type']?.split('boundary=')[1]

    if (!boundary) {
      return res.status(400).json({ message: 'Invalid content type' })
    }

    // Read the raw body
    for await (const chunk of req) {
      chunks.push(chunk)
    }

    const body = Buffer.concat(chunks)
    const parts = body.toString().split(`--${boundary}`)

    let fileName = ''
    let fileData: Buffer | null = null

    // Parse multipart form data
    for (const part of parts) {
      if (part.includes('filename=')) {
        const filenameMatch = part.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          fileName = filenameMatch[1]
        }

        // Extract file data
        const dataStart = part.indexOf('\r\n\r\n') + 4
        const dataEnd = part.lastIndexOf('\r\n')
        if (dataStart > 0 && dataEnd > dataStart) {
          fileData = Buffer.from(part.slice(dataStart, dataEnd))
        }
      }
    }

    if (!fileName || !fileData) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Validate file type
    if (!fileName.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ message: 'Only CSV files are allowed' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await fs.access(uploadsDir)
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true })
    }

    // Save file to disk
    const fileId = Date.now().toString()
    const filePath = path.join(uploadsDir, `${fileId}_${fileName}`)
    await fs.writeFile(filePath, fileData)

    // Save file metadata to database
    const db = new Database('agent360.db')
    const insertFile = db.prepare(`
      INSERT INTO uploaded_files (
        id, original_name, file_path, file_size, uploaded_at, status
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')
    `)

    insertFile.run(fileId, fileName, filePath, fileData.length)
    db.close()

    return res.status(201).json({
      message: 'File uploaded successfully',
      fileId,
      fileName,
      fileSize: fileData.length,
      filePath
    })
  } catch (error) {
    console.error('File upload error:', error)

    return res.status(500).json({
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
