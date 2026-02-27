import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      const { q = '' } = req.query
      const searchTerm = (q as string).toLowerCase().trim()

      if (!searchTerm) {
        return res.status(200).json([])
      }

      // Search agents by name or account number
      const agentsQuery = `
        SELECT
          id,
          name as title,
          'agent' as category,
          'tabler:users' as icon,
          '/agents/view/' || id as url,
          account_number as accountNumber
        FROM agents
        WHERE (name LIKE ? OR account_number LIKE ?)
        AND is_active = 1
        LIMIT 5
      `
      const agents = db.prepare(agentsQuery).all(`%${searchTerm}%`, `%${searchTerm}%`)

      // Search transactions by customer name, transaction ID, account number, or narration
      const transactionsQuery = `
        SELECT DISTINCT
          id,
          customer_name || ' (' || transaction_id || ')' as title,
          'transaction' as category,
          'tabler:receipt' as icon,
          '/transactions/' || id as url,
          customer_name as customerName,
          transaction_id as transactionId,
          agent_id as agentId
        FROM transactions
        WHERE customer_name LIKE ? OR transaction_id LIKE ? OR narration LIKE ? OR customer_account LIKE ?
        LIMIT 5
      `
      const transactions = db
        .prepare(transactionsQuery)
        .all(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)

      // Add some static page suggestions
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

      const results = [...agents, ...transactions, ...staticSuggestions]

      res.status(200).json(results)
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('App bar search API error:', error)
    res.status(500).json({
      message: 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
