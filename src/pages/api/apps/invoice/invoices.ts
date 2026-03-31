import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: {
        agent: {
          select: {
            accountNumber: true,
            branchName: true
          }
        }
      }
    })

    const invoices = transactions.map(transaction => ({
      id: transaction.id,
      invoiceNumber: transaction.transactionId,
      clientName: transaction.agentName,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerAccount: transaction.customerAccount,
      service: transaction.type,
      total: transaction.amount,
      tax: transaction.fee || 0,
      balance: transaction.netAmount || transaction.amount,
      status: transaction.status === 'completed' ? 'Paid' : 'Pending',
      location: transaction.location,
      zone: transaction.zone,
      channel: transaction.channel,
      description: transaction.narration,
      reference: transaction.reference,
      issuedBy: transaction.initiatedBy,
      invoiceDate: transaction.timestamp,
      createdAt: transaction.createdAt,
      agentAccount: transaction.agent?.accountNumber,
      branchName: transaction.agent?.branchName,
      dueDate: transaction.timestamp,
      avatar: '',
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
  }
}
