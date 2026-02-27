import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Get uploaded files from database
    const files = db
      .prepare(
        `
      SELECT
        transaction_id,
        agent_name,
        customer_name,
        amount,
        type,
        status,
        timestamp,
        created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 100
    `
      )
      .all()

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
  } finally {
    db.close()
  }
}
