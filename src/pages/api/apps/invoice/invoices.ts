import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Get transactions from database to serve as "invoices"
    const transactions = db
      .prepare(
        `
      SELECT
        t.id,
        t.transaction_id as invoiceNumber,
        t.agent_name as clientName,
        t.customer_name as customerName,
        t.customer_phone as customerPhone,
        t.customer_account as customerAccount,
        t.type as service,
        t.amount as total,
        t.fee as tax,
        t.net_amount as balance,
        t.status,
        t.location,
        t.zone,
        t.channel,
        t.narration as description,
        t.reference,
        t.initiated_by as issuedBy,
        t.timestamp as invoiceDate,
        t.created_at as createdAt,
        a.account_number as agentAccount,
        a.branch_name as branchName
      FROM transactions t
      LEFT JOIN agents a ON t.agent_id = a.id
      ORDER BY t.timestamp DESC
      LIMIT 100
    `
      )
      .all()

    // Transform data to match expected invoice format
    const invoices = transactions.map((transaction: any) => ({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      clientName: transaction.clientName,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerAccount: transaction.customerAccount,
      service: transaction.service,
      total: transaction.total,
      tax: transaction.tax,
      balance: transaction.balance,
      status: transaction.status === 'completed' ? 'Paid' : 'Pending',
      location: transaction.location,
      zone: transaction.zone,
      channel: transaction.channel,
      description: transaction.description,
      reference: transaction.reference,
      issuedBy: transaction.issuedBy,
      invoiceDate: transaction.invoiceDate,
      createdAt: transaction.createdAt,
      agentAccount: transaction.agentAccount,
      branchName: transaction.branchName,

      // Additional invoice fields
      dueDate: transaction.invoiceDate, // Same as invoice date for simplicity
      avatar: '', // Could add client avatar later
      avatarColor: 'primary',
      invoiceStatus: transaction.status === 'completed' ? 'Paid' : 'Pending'
    }))

    return res.status(200).json({ allData: invoices })
  } catch (error) {
    console.error('Invoices API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
