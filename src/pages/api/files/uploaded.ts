import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get uploaded files from database
    const files = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100,
      select: {
        transactionId: true,
        agentName: true,
        customerName: true,
        amount: true,
        type: true,
        status: true,
        timestamp: true,
        createdAt: true
      }
    })

    // Also check for physical files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    let physicalFiles: string[] = []

    try {
      if (fs.existsSync(uploadsDir)) {
        physicalFiles = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.csv') || file.endsWith('.xlsx'))
      }
    } catch (error) {
      console.error('Error reading uploads directory:', error)
    }

    return res.status(200).json({
      success: true,
      data: {
        databaseFiles: files,
        physicalFiles: physicalFiles,
        totalDatabaseFiles: files.length,
        totalPhysicalFiles: physicalFiles.length
      }
    })
  } catch (error) {
    console.error('Failed to fetch uploaded files:', error)

    return res.status(500).json({
      message: 'Failed to fetch uploaded files',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
