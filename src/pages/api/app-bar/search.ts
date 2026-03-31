import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const { q = '' } = req.query
    const searchTerm = (q as string).toLowerCase().trim()

    if (!searchTerm) {
      return res.status(200).json([])
    }

    // Search agents by name or account number
    const agents = await prisma.agent.findMany({
      where: {
        isActive: 1,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { accountNumber: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        accountNumber: true
      }
    })

    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      title: agent.name,
      category: 'agent',
      icon: 'tabler:users',
      url: `/agents/view/${agent.id}`,
      accountNumber: agent.accountNumber
    }))

    // Search transactions by customer name, transaction ID, account number, or narration
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { customerName: { contains: searchTerm, mode: 'insensitive' } },
          { transactionId: { contains: searchTerm, mode: 'insensitive' } },
          { narration: { contains: searchTerm, mode: 'insensitive' } },
          { customerAccount: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      distinct: ['customerName', 'transactionId'],
      select: {
        id: true,
        customerName: true,
        transactionId: true,
        narration: true,
        agentId: true
      }
    })

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      title: `${t.customerName || 'Unknown'} (${t.transactionId})`,
      category: 'transaction',
      icon: 'tabler:receipt',
      url: `/transactions/${t.id}`,
      customerName: t.customerName,
      transactionId: t.transactionId,
      agentId: t.agentId
    }))

    // Static page suggestions
    const staticSuggestions = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        category: 'page',
        icon: 'tabler:layout-dashboard',
        url: '/dashboard/data-management'
      },
      {
        id: 'agents',
        title: 'Agents',
        category: 'page',
        icon: 'tabler:users',
        url: '/agents/list'
      },
      {
        id: 'commissions',
        title: 'Commissions',
        category: 'page',
        icon: 'tabler:currency-dollar',
        url: '/commission/report'
      },
      {
        id: 'upload',
        title: 'Upload Data',
        category: 'page',
        icon: 'tabler:upload',
        url: '/streaming-upload-demo'
      }
    ]
      .filter(item => item.title.toLowerCase().includes(searchTerm))
      .slice(0, 3)

    const results = [...formattedAgents, ...formattedTransactions, ...staticSuggestions]

    res.status(200).json(results)
  } catch (error) {
    console.error('App bar search API error:', error)
    res.status(500).json({
      message: 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
