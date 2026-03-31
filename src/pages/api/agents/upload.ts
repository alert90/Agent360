import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'
import formidable from 'formidable'
import fs from 'fs'
import csv from 'csv-parser'

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
    const uploadDir = '/tmp'
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024 // 50MB
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = files.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const filePath = file[0].filepath
    const results: any[] = []
    const errors: string[] = []
    let rowCount = 0

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', resolve)
        .on('error', reject)
    })

    // Process agents in batches
    const batchSize = 100
    const agents = []
    const skipped = []

    for (const row of results) {
      rowCount++
      try {
        // Map CSV columns to agent fields
        // Adjust these mappings based on your CSV format
        const accountNumber = row.account_number || row.accountNumber || row.AccountNumber || row['Account Number']
        const name = row.name || row.Name || row.agent_name || row.AgentName
        const type = row.type || row.Type || 'local_agent'
        const branchCode = row.branch_code || row.branchCode || row.BranchCode
        const branchName = row.branch_name || row.branchName || row.BranchName
        const phone = row.phone || row.Phone || row.phone_number
        const email = row.email || row.Email

        if (!accountNumber || !name) {
          errors.push(`Row ${rowCount}: Missing required fields (account_number or name)`)
          continue
        }

        // Check if agent already exists
        const existingAgent = await prisma.agent.findUnique({
          where: { accountNumber }
        })

        if (existingAgent) {
          // Update existing agent
          await prisma.agent.update({
            where: { id: existingAgent.id },
            data: {
              name: name || existingAgent.name,
              type: type || existingAgent.type,
              branchCode: branchCode || existingAgent.branchCode,
              branchName: branchName || existingAgent.branchName,
              phone: phone || existingAgent.phone,
              email: email || existingAgent.email,
              updatedAt: new Date()
            }
          })
          skipped.push(accountNumber)
        } else {
          // Create new agent
          agents.push({
            accountNumber,
            name,
            type: type || 'local_agent',
            branchCode: branchCode || '',
            branchName: branchName || '',
            phone,
            email,
            isActive: 1,
            commissionEligible: 1,
            totalTransactionAmount: 0,
            transactionCount: 0,
            commissionAmount: 0,
            payband: 1.0
          })
        }
      } catch (error) {
        errors.push(`Row ${rowCount}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Batch insert agents
    let created = 0
    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize)
      const result = await prisma.agent.createMany({
        data: batch,
        skipDuplicates: true
      })
      created += result.count
    }

    // Clean up temp file
    fs.unlinkSync(filePath)

    res.status(200).json({
      success: true,
      message: `Processed ${rowCount} rows`,
      stats: {
        totalRows: rowCount,
        created,
        updated: skipped.length,
        failed: errors.length
      },
      errors: errors.slice(0, 10) // Return first 10 errors
    })
  } catch (error) {
    console.error('Agent upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
