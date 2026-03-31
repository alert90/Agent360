import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { limit = '10' } = req.query
    const limitNum = Math.min(parseInt(limit as string), 100)

    const topAgents = await prisma.$queryRaw`
      SELECT
        a.id,
        a.name,
        a."accountNumber",
        a."branchName",
        COUNT(t.id)::integer as "transactionCount",
        COALESCE(SUM(t."amount"), 0)::numeric as "totalAmount",
        COALESCE(SUM(t."commissionAmount"), 0)::numeric as "commissionAmount"
      FROM "agents" a
      LEFT JOIN "transactions" t ON a.id = t."agentId"
        AND t."timestamp" >= NOW() - INTERVAL '30 days'
        AND t.status = 'completed'
      WHERE a."isActive" = 1
      GROUP BY a.id, a.name, a."accountNumber", a."branchName"
      ORDER BY "totalAmount" DESC
      LIMIT ${limitNum}
    `

    res.status(200).json({
      success: true,
      data: topAgents
    })
  } catch (error) {
    console.error('Top agents API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
