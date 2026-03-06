import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, limit = '50' } = req.query
    const limitNum = parseInt(limit as string) || 50

    // Build where clause
    const whereClause: any = {}

    if (period) {
      // Filter by period (e.g., "2025-01" for January 2025)
      // Use a date range query for PostgreSQL
      const periodStr = period as string
      const startDate = new Date(periodStr + '-01')
      const endDate = new Date(periodStr + '-31')

      whereClause.timestamp = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get transactions - without include since no relation is defined in Prisma
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      take: limitNum
    })

    // Convert to expected format
    const formattedTransactions = transactions.map(t => ({
      id: t.transactionId,
      agentId: t.agentId,
      agentName: 'Unknown Agent', // Agent name not available without join
      customerName: t.customerName || 'Unknown Customer',
      customerPhone: t.customerPhone || '',
      customerAccount: t.customerPhone || '',
      type: t.type || 'transfer',
      amount: Number(t.amount) || 0,
      fee: Number(t.fee) || 0,
      netAmount: Number(t.netAmount) || 0,
      commissionAmount: Number(t.commissionAmount) || 0,
      commissionEligible: t.commissionEligible === 1,
      status: t.status || 'completed',
      location: t.location || '',
      zone: t.zone || '',
      channel: t.channel || '',
      narration: t.narration || '',
      reference: t.reference || '',
      initiatedBy: t.initiatedBy || 'customer',
      timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString(),
      branchCode: ''
    }))

    return res.status(200).json(formattedTransactions)
  } catch (error) {
    console.error('Transactions fetch error:', error)

    return res.status(500).json({
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
