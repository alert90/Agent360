import { NextApiRequest, NextApiResponse } from 'next/types'
import fs from 'fs'
import path from 'path'
import { CSVImportServiceClient } from '../../../services/csvImportServiceClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { folderPath } = req.body

    if (!folderPath) {
      return res.status(400).json({ message: 'Folder path is required' })
    }

    // Resolve the folder path relative to the project root
    const resolvedPath = path.resolve(process.cwd(), folderPath)

    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ message: 'Folder does not exist' })
    }

    const files = fs.readdirSync(resolvedPath)
    const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'))

    if (csvFiles.length === 0) {
      return res.status(400).json({ message: 'No CSV files found in the specified folder' })
    }

    const results = []

    for (const csvFile of csvFiles) {
      const filePath = path.join(resolvedPath, csvFile)
      console.log(`Processing CSV file: ${filePath}`)

      try {
        const fileBuffer = fs.readFileSync(filePath)
        const file = new File([new Uint8Array(fileBuffer)], csvFile, { type: 'text/csv' })

        const result = await CSVImportServiceClient.importFromFile(file, progress => {
          console.log(`${csvFile} progress: ${progress}%`)
        })

        if (result.success && result.data) {
          // Import to database via API
          const importResponse = await fetch('http://localhost:3000/api/transactions/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactions: result.data })
          })

          if (importResponse.ok) {
            results.push({
              file: csvFile,
              status: 'success',
              transactionsImported: result.data.length
            })
          } else {
            results.push({
              file: csvFile,
              status: 'database_error',
              error: 'Failed to import to database'
            })
          }
        } else {
          results.push({
            file: csvFile,
            status: 'parse_error',
            errors: result.errors
          })
        }
      } catch (error) {
        results.push({
          file: csvFile,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successful = results.filter(r => r.status === 'success').length
    const totalTransactions = results
      .filter(r => r.status === 'success')
      .reduce((sum, r: any) => sum + r.transactionsImported, 0)

    return res.status(200).json({
      message: `Processed ${csvFiles.length} files, ${successful} successful`,
      results,
      summary: {
        totalFiles: csvFiles.length,
        successfulImports: successful,
        totalTransactionsImported: totalTransactions
      }
    })
  } catch (error) {
    console.error('Folder import error:', error)

    return res.status(500).json({
      message: 'Failed to import from folder',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
