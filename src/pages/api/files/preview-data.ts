import { NextApiRequest, NextApiResponse } from 'next/types'
import { PaginatedData } from '../../../types/uploadTypes'
import { csvImportService } from '../../../services/csvImportService'
import * as fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handlePreviewRequest(req, res)
  } else {
    res.setHeader('Allow', ['GET'])

    return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function handlePreviewRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fileId, page = '1', limit = '100', search = '' } = req.query

    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' })
    }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const searchQuery = search as string

    // Get processed file data from global storage (in production, use database)
    const processedFiles = (global as any).processedFiles || new Map()
    const fileData = processedFiles.get(fileId as string)

    if (!fileData) {
      return res.status(404).json({ message: 'File not found or still processing' })
    }

    // Check if processing is complete
    if (!fileData.result) {
      return res.status(202).json({
        message: 'File is still being processed',
        status: 'processing'
      })
    }

    // Load and parse CSV file for preview using our unified service
    const filePath = fileData.filePath
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' })
    }

    const previewData = await generatePreviewData(filePath, pageNum, limitNum, searchQuery)

    return res.status(200).json(previewData)
  } catch (error) {
    console.error('Preview data error:', error)

    return res.status(500).json({
      message: 'Failed to generate preview data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function generatePreviewData(
  filePath: string,
  page: number,
  limit: number,
  search: string
): Promise<PaginatedData> {
  try {
    // Read file content
    const fileBuffer = fs.readFileSync(filePath)
    const file = new File([new Uint8Array(fileBuffer)], 'preview.csv', { type: 'text/csv' })

    // Use our unified CSV service to preview data
    const previewData = await csvImportService.previewCSV(file, limit * 3) // Get more data for pagination

    // Apply search filter
    let filteredData = previewData
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filteredData = previewData.filter(row => {
        return Object.values(row).some(value => String(value).toLowerCase().includes(searchLower))
      })
    }

    // Calculate pagination
    const total = filteredData.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRows = filteredData.slice(startIndex, endIndex)

    // Get headers from first row
    const headers = paginatedRows.length > 0 ? Object.keys(paginatedRows[0]) : []

    // Get file stats
    const fileStats = fs.statSync(filePath)

    return {
      data: paginatedRows,
      headers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      summary: {
        totalRows: previewData.length,
        columns: headers.length,
        fileSize: formatFileSize(fileStats.size)
      }
    }
  } catch (error) {
    console.error('Error generating preview data:', error)
    throw error
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
