import { NextApiRequest, NextApiResponse } from 'next'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, limit = '50' } = req.query
    const limitNum = parseInt(limit as string) || 50

    const db = new Database('agent360.db')

    let query = `
      SELECT
        t.transaction_id as id,
        t.agent_id,
        a.name as agentName,
        t.customer_name,
        t.customer_phone,
        t.type,
        t.amount,
        t.fee,
        t.net_amount,
        t.commission_amount,
        t.commission_eligible,
        t.status,
        t.location,
        t.zone,
        t.channel,
        t.narration,
        t.reference,
        t.initiated_by,
        t.timestamp
      FROM transactions t
      LEFT JOIN agents a ON t.agent_id = a.id
    `

    const params: any[] = []

    if (period) {
      query += ' WHERE t.timestamp LIKE ?'
      params.push(`${period}%`)
    }

    query += ' ORDER BY t.timestamp DESC LIMIT ?'
    params.push(limitNum)

    const transactions = db.prepare(query).all(...params) as any[]

    // Convert to expected format
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      agentId: t.agent_id,
      agentName: t.agentName || 'Unknown Agent',
      customerName: t.customer_name || 'Unknown Customer',
      customerPhone: t.customer_phone || '',
      customerAccount: t.customer_phone || '',
      type: t.type || 'transfer',
      amount: Number(t.amount) || 0,
      fee: Number(t.fee) || 0,
      netAmount: Number(t.net_amount) || 0,
      commissionAmount: Number(t.commission_amount) || 0,
      commissionEligible: t.commission_eligible === 1,
      status: t.status || 'completed',
      location: t.location || '',
      zone: t.zone || '',
      channel: t.channel || '',
      narration: t.narration || '',
      reference: t.reference || '',
      initiatedBy: t.initiated_by || 'customer',
      timestamp: t.timestamp || new Date().toISOString(),
      branchCode: ''
    }))

    db.close()

    return res.status(200).json(formattedTransactions)
  } catch (error) {
    console.error('Transactions fetch error:', error)

    return res.status(500).json({
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
